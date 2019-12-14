directory_test(async (t, root) => {
  const handle = await createEmptyFile(t, 'trunc_shrink', root);
  const stream = await handle.createWritable();

  await stream.write('1234567890');
  await stream.truncate(5);
  await stream.close();

  assert_equals(await getFileContents(handle), '12345');
  assert_equals(await getFileSize(handle), 5);
}, 'truncate() to shrink a file');

directory_test(async (t, root) => {
  const handle = await createEmptyFile(t, 'trunc_grow', root);
  const stream = await handle.createWritable();

  await stream.write('abc');
  await stream.truncate(5);
  await stream.close();

  assert_equals(await getFileContents(handle), 'abc\0\0');
  assert_equals(await getFileSize(handle), 5);
}, 'truncate() to grow a file');

directory_test(async (t, root) => {
  const dir = await createDirectory(t, 'parent_dir', root);
  const file_name = 'create_writable_fails_when_dir_removed.txt';
  const handle = await createEmptyFile(t, file_name, dir);

  await root.removeEntry('parent_dir', {recursive: true});
  await promise_rejects(t, 'NotFoundError', handle.createWritable());
}, 'createWritable() fails when parent directory is removed');

directory_test(async (t, root) => {
  const dir = await createDirectory(t, 'parent_dir', root);
  const file_name = 'write_fails_when_dir_removed.txt';
  const handle = await createEmptyFile(t, file_name, dir);
  const stream = await handle.createWritable();

  await root.removeEntry('parent_dir', {recursive: true});
  await promise_rejects(t, 'NotFoundError', stream.write('foo'));
}, 'write() fails when parent directory is removed');

directory_test(async (t, root) => {
  const dir = await createDirectory(t, 'parent_dir', root);
  const file_name = 'truncate_fails_when_dir_removed.txt';
  const handle = await createEmptyFile(t, file_name, dir);
  const stream = await handle.createWritable();

  await root.removeEntry('parent_dir', {recursive: true});
  await promise_rejects(t, 'NotFoundError', stream.truncate(0));
}, 'truncate() fails when parent directory is removed');

directory_test(async (t, root) => {
  const handle = await createFileWithContents(
      t, 'atomic_file_is_copied.txt', 'fooks', root);
  const stream = await handle.createWritable({keepExistingData: true});

  await stream.write('bar');
  await stream.close();
  assert_equals(await getFileContents(handle), 'barks');
  assert_equals(await getFileSize(handle), 5);
}, 'createWritable({keepExistingData: true}): atomic writable file stream initialized with source contents');

directory_test(async (t, root) => {
  const handle = await createFileWithContents(
      t, 'atomic_file_is_not_copied.txt', 'very long string', root);
  const stream = await handle.createWritable({keepExistingData: false});

  await stream.write('bar');
  assert_equals(await getFileContents(handle), 'very long string');
  await stream.close();
  assert_equals(await getFileContents(handle), 'bar');
  assert_equals(await getFileSize(handle), 3);
}, 'createWritable({keepExistingData: false}): atomic writable file stream initialized with empty file');

directory_test(async (t, root) => {
  const dir = await createDirectory(t, 'parent_dir', root);
  const file_name = 'atomic_stream_seek_tell.txt';
  const handle = await createFileWithContents(t, file_name, 'ipsum lorem', dir);
  const SEEK_POSITION = 5;

  const stream = await handle.createWritable();
  await stream.seek(SEEK_POSITION);
  assert_equals(await stream.tell(), SEEK_POSITION);

  await stream.seek(SEEK_POSITION+3);
  assert_equals(await stream.tell(), SEEK_POSITION+3);

  await stream.close();
}, 'seek()/tell(): seek updates the file cursor and tell returns it');

directory_test(async (t, root) => {
  const handle = await createEmptyFile(t, 'cursor_update.txt', root);
  const stream = await handle.createWritable();
  assert_equals(await stream.tell(), 0);
  await stream.write('foo');
  assert_equals(await stream.tell(), 3);

  await stream.close();
}, 'tell(): writes update the file cursor');

directory_test(async (t, root) => {
  const handle = await createFileWithContents(
      t, 'trunc_smaller_offset.txt', '1234567890', root);
  const stream = await handle.createWritable({keepExistingData: true});

  assert_equals(await stream.tell(), 0, 'Initial offset is zero.');
  await stream.truncate(5);
  assert_equals(await stream.tell(), 0, 'Offset did not move.');
  await stream.close();

  assert_equals(await getFileContents(handle), '12345');
  assert_equals(await getFileSize(handle), 5);
}, 'tell(): truncate size > offset');

directory_test(async (t, root) => {
  const handle = await createFileWithContents(
      t, 'trunc_bigger_offset.txt', '1234567890', root);
  const stream = await handle.createWritable({keepExistingData: true});

  await stream.seek(6);
  assert_equals(await stream.tell(), 6, 'Offset set.');
  await stream.truncate(5);
  assert_equals(await stream.tell(), 5, 'Offset moved to size.');
  await stream.close();

  assert_equals(await getFileContents(handle), '12345');
  assert_equals(await getFileSize(handle), 5);
}, 'tell(): truncate size < offset');

directory_test(async (t, root) => {
  const handle = await createEmptyFile(t, 'contents', root);
  const stream = await handle.createWritable();

  stream.write('abc');
  stream.write('def');
  stream.truncate(9);
  stream.seek(0);
  stream.write('xyz');
  await stream.close();

  assert_equals(await getFileContents(handle), 'xyzdef\0\0\0');
  assert_equals(await getFileSize(handle), 9);
}, 'commands are queued');
