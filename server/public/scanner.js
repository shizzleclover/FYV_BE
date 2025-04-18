/**
 * QR Code Scanner functionality
 * Uses the device camera to scan QR codes
 */

class QRScanner {
  constructor(videoElement, canvasElement, onSuccess) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.onSuccess = onSuccess;
    this.isScanning = false;
  }

  async start() {
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      // Get access to the camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 720 },
          height: { ideal: 720 }
        } 
      });
      
      this.video.srcObject = stream;
      this.video.setAttribute('playsinline', true); // required for iOS
      this.video.play();
      
      // Start scanning when video is playing
      this.video.onloadedmetadata = () => {
        // Set canvas size to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Start scanning loop
        this.scanFrame();
      };
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.isScanning = false;
      alert('Unable to access camera. Please allow camera access to scan QR codes.');
    }
  }

  stop() {
    this.isScanning = false;
    
    // Stop video and release camera
    if (this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
  }

  scanFrame() {
    if (!this.isScanning) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      // Draw video frame to canvas
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      
      // For a real implementation, we would process the image here to detect QR codes
      // Since we're not including a full QR code library, this is just a placeholder
      // In a real app, we would use something like jsQR to detect and decode the QR code

      // For demo purposes, trigger success after a few seconds
      // In a real implementation, this would be triggered when a QR code is detected
      /*
      setTimeout(() => {
        if (this.isScanning) {
          const fakeUrl = 'http://localhost:5000/join/ABC123';
          this.onSuccess(fakeUrl);
          this.stop();
        }
      }, 3000);
      */
    }
    
    // Schedule next scan
    if (this.isScanning) {
      requestAnimationFrame(() => this.scanFrame());
    }
  }
}

// Export for use in main app
window.QRScanner = QRScanner; 