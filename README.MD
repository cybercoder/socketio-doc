# socketio-doc
A socket.io document generator.

## Installation and Usage
You can install ```socketio-doc``` globally or in your project's ```node_modules``` folder.

To install the latest version on npm globally:

```
npm install -g socketio-doc
```

To install the latest version on npm locally and save it in your package's ```package.json``` file:

```
npm install --save-dev socketio-doc
```

## Configuration
By default needs a file named ```socketio-doc.conf.json``` in your project root folder with contents like these:

```
{
  "version" : "2.3.1",
  "source": ["./src/io/*.js"],
  "destination" : "./socketio-doc"
}
```
or you can simply pass custom file: ```socketio-doc -c <filename>```.

## Inline comments
This is an example for commenting ```emits```, and ```listens```:

```
    /**
     * Singleline or multiline description text. Line breaks are preserved.
     * @socket.io-doc
     * @listen exampleListen description
     * @tag Messaging
     * @data {object}
     * @example
     * {
     *   "id": 1,
     *   "title": 5
     * }
     */
    socket.on('exampleListen', data => {
      /**
       * Singleline or multiline description text. Line breaks are preserved.
       * @socket.io-doc
       * @emit exampleEmit description
       * @tag Messaging
       * @data {object}
       * @example { id: 5, data: [2, 3] }
       */
      socket.emit('exampleEmit', { id: 5, data: [2, 3] });
    });
```

to generate document in interactive ```HTML```, just try:

```
socketio-doc
```
if it is installed globally
or
```
./node_modules/.bin/socketio-doc
```
if installed locally.
It will genetate folders which determined in configuration file as destination.
