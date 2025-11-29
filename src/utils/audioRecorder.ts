export interface AudioRecorderState {
  isRecording: boolean;
  isSupported: boolean;
  duration: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private onStateChange?: (state: AudioRecorderState) => void;
  private onError?: (error: string) => void;

  constructor(
    onStateChange?: (state: AudioRecorderState) => void,
    onError?: (error: string) => void
  ) {
    this.onStateChange = onStateChange;
    this.onError = onError;
  }

  get isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  private updateState() {
    const duration = this.isRecording ? Date.now() - this.startTime : 0;
    this.onStateChange?.({
      isRecording: this.isRecording,
      isSupported: this.isSupported,
      duration
    });
  }

  private startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.isRecording) {
        this.updateState();
      }
    }, 100); // Update every 100ms for smooth timer
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  async startRecording(): Promise<void> {
    if (!this.isSupported) {
      this.onError?.('Audio recording is not supported in this browser');
      return;
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Create MediaRecorder
      const options: MediaRecorderOptions = {};
      
      // Try to use the best available audio format
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        options.mimeType = 'audio/wav';
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.startTime = Date.now();
        this.startTimer(); // Start the timer
        this.updateState();
      };

      this.mediaRecorder.onstop = () => {
        this.stopTimer(); // Stop the timer
        this.updateState();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.onError?.('Recording error occurred');
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      
    } catch (error: any) {
      console.error('Error starting recording:', error);
      this.onError?.(
        error.name === 'NotAllowedError' 
          ? 'Microphone access denied. Please allow microphone access to use voice input.'
          : 'Failed to start recording. Please check your microphone.'
      );
    }
  }

  async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      return null;
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/wav';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        
        // Clean up
        this.cleanup();
        this.updateState();
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
    this.updateState();
  }

  private cleanup(): void {
    // Stop the timer
    this.stopTimer();
    
    // Stop all tracks to release microphone
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.startTime = 0;
  }

  // Get the appropriate file extension based on the recorded format
  getFileExtension(): string {
    const mimeType = this.mediaRecorder?.mimeType || 'audio/wav';
    if (mimeType.includes('webm')) return '.webm';
    if (mimeType.includes('mp4')) return '.mp4';
    if (mimeType.includes('ogg')) return '.ogg';
    return '.wav';
  }

  // Format duration for display
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}