import * as signalR from '@microsoft/signalr';

type BarcodeListener = (barcode: string) => void;
type ScannerConnectedListener = (deviceName: string, mobileConnectionId: string) => void;
type ScannerDisconnectedListener = (mobileConnectionId: string) => void;
type TargetDisconnectedListener = () => void;
type UndoScanListener = () => void;
type ScannerStateListener = (state: string, productName: string) => void;
type ScanFeedbackListener = (success: boolean) => void;
export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';
type ConnectionStateListener = (state: ConnectionState) => void;

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private barcodeListeners: BarcodeListener[] = [];
    private scannerConnectedListeners: ScannerConnectedListener[] = [];
    private scannerDisconnectedListeners: ScannerDisconnectedListener[] = [];
    private targetDisconnectedListeners: TargetDisconnectedListener[] = [];
    private undoScanListeners: UndoScanListener[] = [];
    private scannerStateListeners: ScannerStateListener[] = [];
    private connectionStateListeners: ConnectionStateListener[] = [];
    private scanFeedbackListeners: ScanFeedbackListener[] = [];
    private isConnected: boolean = false;
    private lastMobileConnectionId: string | null = null;

    // Vite proxy üzerinden veya Native uygulamalar için .env dosyasından alınan API URL'sini kullanıyoruz.
    private readonly hubUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/barcodeHub` : '/barcodeHub';

    public startConnection(token: string) {
        if (this.connection) {
            return;
        }

        let clientId = sessionStorage.getItem('webakus_client_id');
        if (!clientId) {
            // Use standard crypto if available, otherwise fallback
            clientId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('webakus_client_id', clientId);
        }

        const urlWithParams = `${this.hubUrl}?clientId=${clientId}`;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(urlWithParams, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.connection.onreconnecting((error) => {
            console.warn("SignalR bağlantısı koptu, yeniden bağlanılıyor...", error);
            this.isConnected = false;
            this.connectionStateListeners.forEach(listener => listener('reconnecting'));
        });

        this.connection.onreconnected((connectionId) => {
            console.log("SignalR yeniden bağlandı. Yeni ID:", connectionId);
            this.isConnected = true;
            this.connectionStateListeners.forEach(listener => listener('connected'));
        });

        this.connection.onclose((error) => {
            console.error("SignalR bağlantısı kapandı.", error);
            this.isConnected = false;
            this.connectionStateListeners.forEach(listener => listener('disconnected'));
        });

        this.connection.on('ReceiveBarcode', (barcode: string) => {
            console.log("SignalR'dan barkod alındı:", barcode);
            this.barcodeListeners.forEach(listener => listener(barcode));
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('barcode-scanned', { detail: barcode }));
            }
        });

        this.connection.on('MobileScannerConnected', (deviceName: string, mobileConnectionId: string) => {
            console.log("Mobil barkod okuyucu bağlandı:", deviceName, mobileConnectionId);
            this.lastMobileConnectionId = mobileConnectionId;
            this.scannerConnectedListeners.forEach(listener => listener(deviceName, mobileConnectionId));
        });

        this.connection.on('MobileScannerDisconnected', (mobileConnectionId: string) => {
            console.log("Mobil barkod okuyucu bağlantısı koptu:", mobileConnectionId);
            if (this.lastMobileConnectionId === mobileConnectionId) {
                this.lastMobileConnectionId = null;
            }
            this.scannerDisconnectedListeners.forEach(listener => listener(mobileConnectionId));
        });

        this.connection.on('TargetComputerDisconnected', () => {
            console.log("Bağlı olduğumuz masaüstü bilgisayarın bağlantısı koptu.");
            this.targetDisconnectedListeners.forEach(listener => listener());
        });

        this.connection.on('ReceiveUndoScan', () => {
            console.log("SignalR'dan geri al komutu geldi");
            this.undoScanListeners.forEach(listener => listener());
        });

        this.connection.on('ReceiveScannerState', (state: string, productName: string) => {
            this.scannerStateListeners.forEach(listener => listener(state, productName));
        });

        this.connection.on('ReceiveScanFeedback', (success: boolean) => {
            this.scanFeedbackListeners.forEach(listener => listener(success));
        });

        this.connection.start()
            .then(() => {
                this.isConnected = true;
                this.connectionStateListeners.forEach(listener => listener('connected'));
                console.log('SignalR Hub bağlantısı başarılı.');
            })
            .catch(err => {
                console.error('SignalR Hub bağlantı hatası:', err);
                this.connectionStateListeners.forEach(listener => listener('disconnected'));
            });
    }

    public stopConnection() {
        if (this.connection) {
            this.connection.stop().then(() => {
                this.isConnected = false;
                this.connection = null;
                this.connectionStateListeners.forEach(listener => listener('disconnected'));
            });
        }
    }

    public addBarcodeListener(listener: BarcodeListener) {
        this.barcodeListeners.push(listener);
    }

    public removeBarcodeListener(listener: BarcodeListener) {
        this.barcodeListeners = this.barcodeListeners.filter(l => l !== listener);
    }

    public addScannerConnectedListener(listener: ScannerConnectedListener) {
        this.scannerConnectedListeners.push(listener);
    }

    public removeScannerConnectedListener(listener: ScannerConnectedListener) {
        this.scannerConnectedListeners = this.scannerConnectedListeners.filter(l => l !== listener);
    }

    public addScannerDisconnectedListener(listener: ScannerDisconnectedListener) {
        this.scannerDisconnectedListeners.push(listener);
    }

    public removeScannerDisconnectedListener(listener: ScannerDisconnectedListener) {
        this.scannerDisconnectedListeners = this.scannerDisconnectedListeners.filter(l => l !== listener);
    }

    public addTargetDisconnectedListener(listener: TargetDisconnectedListener) {
        this.targetDisconnectedListeners.push(listener);
    }

    public removeTargetDisconnectedListener(listener: TargetDisconnectedListener) {
        this.targetDisconnectedListeners = this.targetDisconnectedListeners.filter(l => l !== listener);
    }

    public addUndoScanListener(listener: UndoScanListener) {
        this.undoScanListeners.push(listener);
    }

    public removeUndoScanListener(listener: UndoScanListener) {
        this.undoScanListeners = this.undoScanListeners.filter(l => l !== listener);
    }

    public addScannerStateListener(listener: ScannerStateListener) {
        this.scannerStateListeners.push(listener);
    }

    public removeScannerStateListener(listener: ScannerStateListener) {
        this.scannerStateListeners = this.scannerStateListeners.filter(l => l !== listener);
    }

    public addConnectionStateListener(listener: ConnectionStateListener) {
        this.connectionStateListeners.push(listener);
    }

    public removeConnectionStateListener(listener: ConnectionStateListener) {
        this.connectionStateListeners = this.connectionStateListeners.filter(l => l !== listener);
    }

    public addScanFeedbackListener(listener: ScanFeedbackListener) {
        this.scanFeedbackListeners.push(listener);
    }

    public removeScanFeedbackListener(listener: ScanFeedbackListener) {
        this.scanFeedbackListeners = this.scanFeedbackListeners.filter(l => l !== listener);
    }


    public async sendBarcode(targetConnectionId: string, barcode: string): Promise<boolean> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.error("SignalR bağlantısı kurulu değil.");
            return false;
        }

        try {
            await this.connection.invoke("SendBarcode", targetConnectionId, barcode);
            return true;
        } catch (error) {
            console.error("Barkod gönderme hatası:", error);
            return false;
        }
    }

    public async undoLastScan(targetConnectionId: string): Promise<boolean> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.error("SignalR bağlantısı kurulu değil.");
            return false;
        }

        try {
            await this.connection.invoke("UndoLastScan", targetConnectionId);
            return true;
        } catch (error) {
            console.error("Geri alma hatası:", error);
            return false;
        }
    }

    public async notifyMobileScannerConnected(targetConnectionId: string, deviceName: string): Promise<boolean> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            return false;
        }

        try {
            await this.connection.invoke("NotifyMobileScannerConnected", targetConnectionId, deviceName);
            return true;
        } catch (error) {
            console.error("Mobil okuyucu bildirim hatası:", error);
            return false;
        }
    }

    public async notifyMobileScannerDisconnected(targetConnectionId: string): Promise<boolean> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            return false;
        }

        try {
            await this.connection.invoke("NotifyMobileScannerDisconnected", targetConnectionId);
            return true;
        } catch (error) {
            console.error("Mobil okuyucu kopma bildirim hatası:", error);
            return false;
        }
    }

    public async updateScannerState(mobileConnectionId: string, state: string, productName: string): Promise<boolean> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            return false;
        }

        try {
            await this.connection.invoke("UpdateScannerState", mobileConnectionId, state, productName);
            return true;
        } catch (error) {
            console.error("Okuyucu durumu güncelleme hatası:", error);
            return false;
        }
    }

    public async sendScanFeedback(mobileConnectionId: string, success: boolean): Promise<boolean> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            return false;
        }
        try {
            await this.connection.invoke('SendScanFeedback', mobileConnectionId, success);
            return true;
        } catch (error) {
            console.error('Scan feedback gönderme hatası:', error);
            return false;
        }
    }

    public getConnectionId(): string | null {
        return this.connection?.connectionId || null;
    }

    public getLastMobileConnectionId(): string | null {
        return this.lastMobileConnectionId;
    }
}

export const signalRService = new SignalRService();
