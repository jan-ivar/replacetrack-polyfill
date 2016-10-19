if (!window.RTCPeerConnection.prototype.getSenders) {
  let orgRTCPeerConnection = window.RTCPeerConnection;
  window.RTCPeerConnection = function(config) {
    let pc = new orgRTCPeerConnection(config);
    pc._senders = [];
    pc.getSenders = () => pc._senders;
    pc._orgAddStream = pc.addStream;
    pc.addStream = stream => {
      pc._orgAddStream(stream);
      stream.getTracks().forEach(track => pc._senders.push({ track,
        replaceTrack: function (withTrack, stream) {
          return new Promise(resolve => {
            stream.removeTrack(track);
            stream.addTrack(withTrack);
            let onn = pc.onnegotiationneeded;
            pc.onnegotiationneeded = null;
            pc.removeStream(stream);
            pc._orgAddStream(stream);
            if (onn) {
              Promise.resolve().then(onn);
              pc.addEventListener("signalingstatechange", function listener() {
                if (pc.signalingState != "stable") return;
                pc.removeEventListener("signalingstatechange", listener);
                pc.onnegotiationneeded = onn;
                resolve();
              });
            }
          });
        }
      }));
    };
    return pc;
  }
}
