import { keccak_256 } from "@noble/hashes/sha3";
import { ArgumentParser, FileType } from "argparse";
import { RawPrivateKey } from "@planetarium/account";
import { encode, decode, isDictionary, BencodexDictionary } from "@planetarium/bencodex";
import Blob from "cross-blob";

globalThis.atob = (str) => Buffer.from(str, 'base64').toString('binary');
globalThis.Blob = Blob;

const parser = new ArgumentParser({ description: 'Sign bencodex-encoded transaction' });

const signTx = async (privatekeyBytes: Uint8Array, txBytes: Uint8Array) => {
  const privateKey = RawPrivateKey.fromBytes(privatekeyBytes);
  const publicKey = privateKey.publicKey;
  const publicKeyBytes = publicKey.toRawBytes("uncompressed");
  let tx = decode(txBytes);
  if (!isDictionary(tx)) {
    throw new Error("The given tx doesn't seem to bencodex dictionary.");
  }

  const addressDigest = keccak_256(publicKeyBytes.slice(1));
  
  tx = new BencodexDictionary(
    Array.from(tx.entries()).concat([
      [Buffer.from([0x73]), addressDigest.slice(addressDigest.length - 20)],
      [Buffer.from([0x70]), publicKeyBytes],
    ])
  );
  const signature = await privateKey.sign(encode(tx));
  tx = new BencodexDictionary(
    Array.from(tx.entries()).concat([
      [Buffer.from([0x53]), signature.toBytes()],
    ])
  );

  console.log(Buffer.from(encode(tx)).toString("hex"));
};

parser.add_argument(
  'privatekey', 
  { help : 'A hex-encoded private key for signing.'}
);
parser.add_argument(
  '--tx',
  { 
    help: 'A hex-encoded transaction bytes.',
  }
);
parser.add_argument(
  '--txfile',
  { 
    help: 'A path of the transaction file to sign. it should be bencodex format.',
    type: FileType('r'),
  }
);

const args = parser.parse_args();

if (args.tx === undefined && args.txfile === undefined) {
  console.error("Must specify --tx or --txfile.");
} else if (!!args.tx && !!args.txfile) {
  console.error("Can't specify --tx and --txfile same time.");
} else if (!!args.txfile) {
  const chunks: Array<Buffer> = [];
  args.txfile.on('data', (chunk: Buffer) => chunks.push(chunk))
  args.txfile.on('end', () => {
    return signTx(Buffer.from(args.privatekey, "hex"), Buffer.concat(chunks));
  });  
} else if (!!args.tx) {
  signTx(Buffer.from(args.privatekey, "hex"), Buffer.from(args.tx, "hex"));
}

