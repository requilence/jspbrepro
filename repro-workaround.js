const jspb = require('google-protobuf');

// Get a reference to the decoder's prototype
const tempReader = new jspb.BinaryReader(new Uint8Array([0]));
const decoderProto = Object.getPrototypeOf(tempReader.decoder_);
const originalDecoderReadString = decoderProto.readString;

// Patch the decoder's readString to always use fatal=false
decoderProto.readString = function(length, fatal) {
  // Force fatal to false to allow invalid UTF-8
  return originalDecoderReadString.call(this, length, false);
};

const { TestMessage } = require('./message_pb.js');

// Create a message with valid UTF-8
const validMsg = new TestMessage();
validMsg.setText('Hello World');
const validBytes = validMsg.serializeBinary();
console.log('Valid UTF-8 encoded bytes:', Buffer.from(validBytes).toString('hex'));

// Decode valid message - works fine
const decodedValid = TestMessage.deserializeBinary(validBytes);
console.log('Valid decoded:', decodedValid.getText());

// Now let's create a binary payload with invalid UTF-8 in the string field
const invalidUtf8Bytes = new Uint8Array([
  0x0a,       // field 1, wire type 2 (length-delimited)
  0x04,       // length = 4
  0x80,       // invalid: lone continuation byte
  0xfe,       // invalid: never valid in UTF-8
  0xff,       // invalid: never valid in UTF-8
  0x41        // 'A' - valid
]);

console.log('\nAttempting to decode message with invalid UTF-8 bytes...');
console.log('Invalid UTF-8 bytes:', Buffer.from(invalidUtf8Bytes).toString('hex'));

try {
  const decodedInvalid = TestMessage.deserializeBinary(invalidUtf8Bytes);
  console.log('Decoded text:', JSON.stringify(decodedInvalid.getText()));
  console.log('Decoded text bytes:', Buffer.from(decodedInvalid.getText()).toString('hex'));
} catch (err) {
  console.log('ERROR decoding invalid UTF-8:', err.message);
}

// Overlong encoding
const overlongBytes = new Uint8Array([
  0x0a,       // field 1, wire type 2 (length-delimited)
  0x02,       // length = 2
  0xc0,       // start of overlong sequence
  0x80        // overlong encoding of NUL character
]);

console.log('\nAttempting to decode overlong UTF-8 encoding...');
try {
  const decodedOverlong = TestMessage.deserializeBinary(overlongBytes);
  console.log('Decoded overlong:', JSON.stringify(decodedOverlong.getText()));
} catch (err) {
  console.log('ERROR decoding overlong UTF-8:', err.message);
}

// Truncated multi-byte sequence
const truncatedBytes = new Uint8Array([
  0x0a,       // field 1, wire type 2 (length-delimited)
  0x02,       // length = 2
  0xe2,       // start of 3-byte UTF-8 sequence
  0x82        // missing third byte
]);

console.log('\nAttempting to decode truncated multi-byte UTF-8...');
try {
  const decodedTruncated = TestMessage.deserializeBinary(truncatedBytes);
  console.log('Decoded truncated:', JSON.stringify(decodedTruncated.getText()));
} catch (err) {
  console.log('ERROR decoding truncated UTF-8:', err.message);
}
