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
// Protobuf wire format for string: field_number << 3 | 2 (length-delimited) = 0x0a
// Then varint length, then the bytes

// Invalid UTF-8 sequences:
// 0x80 - continuation byte without leading byte
// 0xfe, 0xff - never valid in UTF-8
// 0xc0, 0x80 - overlong encoding of NUL

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
  console.log('Decoded (might have replacement chars):', decodedInvalid.getText());
  console.log('Decoded text bytes:', Buffer.from(decodedInvalid.getText()).toString('hex'));
} catch (err) {
  console.log('ERROR decoding invalid UTF-8:', err.message);
  console.log('Full error:', err);
}

// Another example: overlong encoding (security concern in some contexts)
const overlongBytes = new Uint8Array([
  0x0a,       // field 1, wire type 2 (length-delimited)
  0x02,       // length = 2
  0xc0,       // start of overlong sequence
  0x80        // overlong encoding of NUL character
]);

console.log('\nAttempting to decode overlong UTF-8 encoding...');
console.log('Overlong bytes:', Buffer.from(overlongBytes).toString('hex'));

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
  0xe2,       // start of 3-byte UTF-8 sequence (€ euro sign would be e2 82 ac)
  0x82        // missing third byte
]);

console.log('\nAttempting to decode truncated multi-byte UTF-8...');
console.log('Truncated bytes:', Buffer.from(truncatedBytes).toString('hex'));

try {
  const decodedTruncated = TestMessage.deserializeBinary(truncatedBytes);
  console.log('Decoded truncated:', JSON.stringify(decodedTruncated.getText()));
} catch (err) {
  console.log('ERROR decoding truncated UTF-8:', err.message);
}
