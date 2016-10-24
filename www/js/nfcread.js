var readapp = {
/*
   Application constructor
*/
    initialize: function() {
      this.bindEvents();
      //console.log("Starting NDEF Events app");
   },
/*
   bind any events that are required on startup to listeners:
*/
   bindEvents: function() {
      document.addEventListener('deviceready', this.onDeviceReady, false);
   },

/*
   this runs when the device is ready for user interaction:
*/
   onDeviceReady: function() {
       nfc.enabled(function(){
                nfc.addTagDiscoveredListener(nfcTagDetected);
                //nfd.addNdefListener(ndefTagDetected);
            },
            function(){
                var state = confirm('NFC is disabled. Please enable NFC.');
                if(state == true)
                    nfc.showSettings();
        });

      nfc.addTagDiscoveredListener(
         readapp.onNonNdef,           // tag successfully scanned
         function (status) {      // listener successfully initialized
            readapp.display("Listening for NFC tags.");
         },
         function (error) {       // listener fails to initialize
            readapp.display("NFC reader failed to initialize "
               + JSON.stringify(error));
         }
      );

      nfc.addNdefFormatableListener(
         readapp.onNonNdef,           // tag successfully scanned
         function (status) {      // listener successfully initialized
            readapp.display("Listening for NDEF Formatable tags.");
         },
         function (error) {       // listener fails to initialize
            readapp.display("NFC reader failed to initialize "
               + JSON.stringify(error));
         }
      );

      nfc.addNdefListener(
         readapp.onNfc,               // tag successfully scanned
         function (status) {      // listener successfully initialized
            readapp.display("Listening for NDEF messages.");
         },
         function (error) {       // listener fails to initialize
            readapp.display("NFC reader failed to initialize "
               + JSON.stringify(error));
         }
      );

      nfc.addMimeTypeListener(
         "text/plain",
         readapp.onNfc,               // tag successfully scanned
         function (status) {      // listener successfully initialized
            readapp.display("Listening for plain text MIME Types.");
         },
         function (error) {       // listener fails to initialize
            readapp.display("NFC reader failed to initialize "
               + JSON.stringify(error));
         }
      );

      readapp.display("Tap a tag to read data.");
   },

   /*
      appends @message to the message div:
   */
   display: function(message) {
      var label = document.createTextNode(message),
      lineBreak = document.createElement("br");
      messageDiv.appendChild(lineBreak);         // add a line break
      messageDiv.appendChild(label);             // add the text
   },
   /*
      clears the message div:
   */
   clear: function() {
       messageDiv.innerHTML = "";
   },

   /*
      Process NDEF tag data from the nfcEvent
   */
   onNfc: function(nfcEvent) {
      readapp.clear();              // clear the message div
      // display the event type:
      readapp.display(" Event Type: " + nfcEvent.type);
      readapp.showTag(nfcEvent.tag);   // display the tag details
   },

   /*
      Process non-NDEF tag data from the nfcEvent
      This includes
       * Non NDEF NFC Tags
       * NDEF Formatable Tags
       * Mifare Classic Tags on Nexus 4, Samsung S4
       (because Broadcom doesn't support Mifare Classic)
   */
   onNonNdef: function(nfcEvent) {
      readapp.clear();              // clear the message div
      // display the event type:
      readapp.display("Event Type: " + nfcEvent.type);
      var tag = nfcEvent.tag;
      readapp.display("Tag ID: " + nfc.bytesToHexString(tag.id));
      readapp.display("Tech Types: ");
      for (var i = 0; i < tag.techTypes.length; i++) {
         readapp.display("  * " + tag.techTypes[i]);
      }
   },

/*
   writes @tag to the message div:
*/

   showTag: function(tag) {
      // display the tag properties:
      readapp.display("Tag ID: " + nfc.bytesToHexString(tag.id));
      readapp.display("Tag Type: " +  tag.type);
      readapp.display("Max Size: " +  tag.maxSize + " bytes");
      readapp.display("Is Writable: " +  tag.isWritable);
      readapp.display("Can Make Read Only: " +  tag.canMakeReadOnly);

      // if there is an NDEF message on the tag, display it:
      var thisMessage = tag.ndefMessage;
      if (thisMessage !== null) {
         // get and display the NDEF record count:
         readapp.display("Tag has NDEF message with " + thisMessage.length
            + " record" + (thisMessage.length === 1 ? ".":"s."));

         // switch is part of the extended example
         var type =  nfc.bytesToString(thisMessage[0].type);
         switch (type) {
            case nfc.bytesToString(ndef.RTD_TEXT):
               readapp.display("Looks like a text record to me.");
               break;
            case nfc.bytesToString(ndef.RTD_URI):
               readapp.display("That's a URI right there");
               break;
            case nfc.bytesToString(ndef.RTD_SMART_POSTER):
               readapp.display("Golly!  That's a smart poster.");
               break;
            // add any custom types here,
            // such as MIME types or external types:
            case 'android.com:pkg':
               readapp.display("You've got yourself an AAR there.");
               break;
            default:
               readapp.display("I don't know what " +
                  type +
                  " is, must be a custom type");
               break;
         }
         // end of extended example

         readapp.display("Message Contents: ");
         readapp.showMessage(thisMessage);
      }
   },
/*
   iterates over the records in an NDEF message to display them:
*/
   showMessage: function(message) {
       readapp.display(message.length);
      for (var i=0; i < message.length; i++) {
         // get the next record in the message array:
         var record = message[i];
         readapp.showRecord(record);          // show it
      }
   },
/*
   writes @record to the message div:
*/
   showRecord: function(record) {
      // display the TNF, Type, and ID:
      readapp.display(" ");
      readapp.display("TNF: " + record.tnf);
      readapp.display("Type: " +  nfc.bytesToString(record.type));
      readapp.display("ID: " + nfc.bytesToString(record.id));

      // if the payload is a Smart Poster, it's an NDEF message.
      // read it and display it (recursion is your friend here):
      if (nfc.bytesToString(record.type) === "Sp") {
         var ndefMessage = ndef.decodeMessage(record.payload);
         readapp.showMessage(ndefMessage);

      // if the payload's not a Smart Poster, display it:
      } else {
         readapp.display("Payload: " + nfc.bytesToString(record.payload));
      }
   }
};     // end of app
