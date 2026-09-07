/**
 * Declaraciones globales de tipos para Web APIs de hardware y navegador (SEC-010)
 * Proporciona tipado estricto para Web Bluetooth, Web Serial, Web NFC y WebKit Audio.
 */

// --- 1. Web Bluetooth API ---
interface BluetoothLEScanFilter {
  name?: string;
  namePrefix?: string;
  services?: (string | number)[];
}

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: (string | number)[];
  acceptAllDevices?: boolean;
}

interface BluetoothCharacteristicProperties {
  readonly broadcast: boolean;
  readonly read: boolean;
  readonly writeWithoutResponse: boolean;
  readonly write: boolean;
  readonly notify: boolean;
  readonly indicate: boolean;
  readonly authenticatedSignedWrites: boolean;
  readonly reliableWrite: boolean;
  readonly writableAuxiliaries: boolean;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly service: BluetoothRemoteGATTService;
  readonly uuid: string;
  readonly properties: BluetoothCharacteristicProperties;
  readonly value?: DataView;
  getDescriptor(descriptor: string | number): Promise<unknown>;
  getDescriptors(descriptor?: string | number): Promise<unknown[]>;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse?(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface BluetoothRemoteGATTService extends EventTarget {
  readonly device: BluetoothDevice;
  readonly uuid: string;
  readonly isPrimary: boolean;
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(characteristic?: string | number): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
  readonly device: BluetoothDevice;
  readonly connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(service?: string | number): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDevice extends EventTarget {
  readonly id: string;
  readonly name?: string;
  readonly gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface Bluetooth extends EventTarget {
  getAvailability(): Promise<boolean>;
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
}

// --- 2. Web Serial API ---
interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[];
}

interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialPort extends EventTarget {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  getInfo(): SerialPortInfo;
  forget?(): Promise<void>;
}

interface Serial extends EventTarget {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
}

// --- 3. Web NFC (NDEFReader) API ---
interface NDEFRecord {
  readonly recordType: string;
  readonly mediaType?: string;
  readonly id?: string;
  readonly data?: DataView;
  readonly encoding?: string;
  readonly lang?: string;
  toRecords?(): NDEFRecord[];
}

interface NDEFMessage {
  readonly records: readonly NDEFRecord[];
}

interface NDEFReadingEvent extends Event {
  readonly serialNumber: string;
  readonly message: NDEFMessage;
}

interface NDEFScanOptions {
  signal?: AbortSignal;
}

interface NDEFRecordInit {
  recordType: string;
  mediaType?: string;
  id?: string;
  encoding?: string;
  lang?: string;
  data?: BufferSource | string | number | unknown;
}

interface NDEFMessageInit {
  records: NDEFRecordInit[];
}

type NDEFMessageSource = string | BufferSource | NDEFMessageInit;

interface NDEFWriteOptions {
  overwrite?: boolean;
  signal?: AbortSignal;
}

interface NDEFReader extends EventTarget {
  onreading: ((this: NDEFReader, event: NDEFReadingEvent) => void) | null;
  onreadingerror: ((this: NDEFReader, event: Event) => void) | null;
  scan(options?: NDEFScanOptions): Promise<void>;
  write(message: NDEFMessageSource, options?: NDEFWriteOptions): Promise<void>;
}

declare const NDEFReader: {
  prototype: NDEFReader;
  new (): NDEFReader;
};

// --- 4. Global Window and Navigator Extensions ---
interface Navigator {
  readonly bluetooth?: Bluetooth;
  readonly serial?: Serial;
  readonly standalone?: boolean;
}

interface Window {
  NDEFReader?: typeof NDEFReader;
  webkitAudioContext?: typeof AudioContext;
}
