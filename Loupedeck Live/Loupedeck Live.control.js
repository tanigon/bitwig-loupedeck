loadAPI(17);

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Loupedeck", "Loupedeck Live", "0.1", "8e56e4a9-0159-4e61-b40c-2928bc43e862", "tanigon");
host.defineMidiPorts(1, 1);

host.addDeviceNameBasedDiscoveryPair(["Loupedeck Live"], ["Loupedeck Live"])

const TIMING_DELAY_MS = 50

const C0 = 24
const D0 = 26
const E0 = 28
const F0 = 29
const G0 = 31
const A0 = 33
const C1 = 36
const D1 = 38
const Dis1 = 39
const E1 = 40
const F1 = 41
const G1 = 43

const CC20 = 20
const CC21 = 21
const CC22 = 22
const CC23 = 23
const CC25 = 25

var isPlaying = false
var application
var cursorTrack
var cursorDevice
var previousChannelValue = 0
var previousPanValue = 0
var previousVolumeValue = 0
var previousDeviceValue = 0
var previousBarValue = 0

function init() {
   application = host.createApplication()
   transport = host.createTransport()
   host.getMidiInPort(0).setMidiCallback(onMidi0)
   host.getMidiInPort(0).setSysexCallback(onSysex0)
   cursorTrack = host.createCursorTrack("LOUPEDECK_CURSOR", "Track Cursor", 0, 0, true)
   cursorDevice = cursorTrack.createCursorDevice("LOUPEDECK DEVICE", "Device Cursor", 0, CursorDeviceFollowMode.FOLLOW_SELECTION)
   cursorDevice.name().markInterested()

   transport.playStartPosition().markInterested()
   transport.isPlaying().addValueObserver( (newValue) => { isPlaying = newValue } )

   println("Loupedeck Live initialized!")
}

// Called when a short MIDI message is received on MIDI input port 0.
function onMidi0(status, data1, data2) {
   printMidi(status, data1, data2)
   
   if (isNoteOn(status)) {
      switch (data1) { 
         case C0: // PLAY
            transport.play()
            break
         case C1: // RESTART
            if (isPlaying) {
               transport.continuePlayback() // actually it stop and retain playback marker
               host.scheduleTask( () => { transport.play(); }, TIMING_DELAY_MS)
            } else {
               transport.play()
            }
            break
         case D0: // STOP
            if (isPlaying) {
               transport.stop()
            }
            break
         case D1: // SOLO
            cursorTrack.solo().toggle()
            break    
         case Dis1: // MUTE
            cursorTrack.mute().toggle()
            break        
         case E0: // REC
            transport.record()
            if (!isPlaying) {
               host.scheduleTask( () => { transport.play(); }, TIMING_DELAY_MS)            
            }
            break
         case E1: // REWIND TO TOP
            // transport.rewind()   // ?? some weird movement
            transport.playStartPosition().set(0.0)
            if (isPlaying) {
               transport.jumpToPlayStartPosition()
            }
            break
         case F0: // UNDO
            application.undo()
            break
         case F1: // PREVIOUS CUE
            transport.jumpToPreviousCueMarker()
            break
         case G1: // NEXT CUE
            transport.jumpToNextCueMarker()
            break
         case G0: // TOGGLE/FOCUS DEVICES
            application.getAction("focus_or_toggle_device_panel").invoke()
            break
         case A0: // BYPASS DEVICE
            cursorDevice.isEnabled().toggle()
            break
      }
   } else if (isChannelController(status)) {
      switch (data1) {
         case CC20:
            if (data2 <= previousChannelValue) { // including "0" case
               cursorTrack.selectPrevious()
            } else if (data2 >= previousChannelValue) {
               cursorTrack.selectNext()
            }
            previousChannelValue = data2
            break
         case CC21:
            // experimented: faster moving rotary-encoder sends contiguous value not jumped value.
            if (data2 <= previousPanValue) {
               cursorTrack.pan().inc(-1, 128)
            } else if (data2 >= previousPanValue) {
               cursorTrack.pan().inc(1, 128)
            }
            previousPanValue = data2
            break
         case CC22:
            if (data2 <= previousVolumeValue) {
               cursorTrack.volume().inc(-1, 128)
            } else if (data2 >= previousVolumeValue) {
               cursorTrack.volume().inc(1, 128)
            }
            previousVolumeValue = data2
            break
         case CC23:
            if (data2 <= previousDeviceValue) { // including "0" case
               cursorDevice.selectPrevious()
            } else if (data2 >= previousDeviceValue) {
               cursorDevice.selectNext()
            }
            
            host.println(cursorDevice.name().get())
            previousDeviceValue = data2
            break
         case CC25:
            var currentPos = Math.floor(transport.playStartPosition().get())
            if (data2 <= previousBarValue) { 
               application.getAction("jump_to_beginning_of_previous_bar").invoke()
               // 1.0 is "1 beat", so must have correct time signature to calculate where is a head of next bars. boring.
               // transport.incPosition(-1.0, true)
            } else if (data2 >= previousBarValue) {
               application.getAction("jump_to_beginning_of_next_bar").invoke()
               // 1.0 is "1 beat", so must have correct time signature to calculate where is a head of next bars. boring.
               // transport.incPosition(1.0, true)
            }
            previousBarValue = data2
            break            
      }
   }
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