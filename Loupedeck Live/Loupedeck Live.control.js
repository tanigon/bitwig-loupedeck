loadAPI(17);

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Loupedeck", "Loupedeck Live", "0.1", "8e56e4a9-0159-4e61-b40c-2928bc43e862", "tanigon");
host.defineMidiPorts(1, 0);

function init() {
   transport = host.createTransport();
   host.getMidiInPort(0).setMidiCallback(onMidi0);
   host.getMidiInPort(0).setSysexCallback(onSysex0);

   println("Loupedeck Live initialized!");
}

// Called when a short MIDI message is received on MIDI input port 0.
function onMidi0(status, data1, data2) {
   // TODO: Implement your MIDI input handling code here.
}

// Called when a MIDI sysex message is received on MIDI input port 0.
function onSysex0(data) {
   // MMC Transport Controls:
   switch (data) {
      case "f07f7f0605f7":
         transport.rewind();
         break;
      case "f07f7f0604f7":
         transport.fastForward();
         break;
      case "f07f7f0601f7":
         transport.stop();
         break;
      case "f07f7f0602f7":
         transport.play();
         break;
      case "f07f7f0606f7":
         transport.record();
         break;
   }
}

function flush() {
}

function exit() {
}