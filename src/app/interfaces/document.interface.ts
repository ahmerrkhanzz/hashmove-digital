import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
export interface DocumentUpload {
    DocumentTypeID: number;
    DocumentTypeCode: string;
    DocumentTypeName: string;
    DocumentTypeNameOL: string;
    DocumentTypeDesc: string;
    SortingOrder: number;
    DocumentNature: string;
    DocumentSubProcess: string;
    DocumentID?: any;
    UserID?: any;
    BookingID?: any;
    CompanyID?: any;
    ProviderID?: any;
    DocumentName: string;
    DocumentDesc: string;
    DocumentFileName?: any;
    DocumentFileContent: string;
    DocumentUploadedFileType?: any;
    DocumentLastStatus?: any;
    ExpiryStatusCode: string;
    ExpiryStatusMessage: string;
    DocumentUploadDate?: any;
    IsDownloadable: boolean;
    IsUploadable?: any;
    IsApprovalRequired: boolean;
    BusinessLogic?: any;
    CopyOfDocTypeID?: any;
    MetaInfoKeysDetail?: any;
    FileContent:fileContent[]
}
export interface fileContent{
    documentFileName: string,
    documentFile: string,
    documentUploadedFileType: string
}
export interface DocumentFile {
    fileBaseString: string
    fileName: string
    fileType: string
    fileUrl?: string | ArrayBuffer
}
export interface MetaInfoKeysDetail {
  DocumentMetaInfoKeyID: number;
  KeyName: string;
  KeyNameDesc: string;
  KeyValue?: string;
  IsMandatory: boolean;
  DataType: string;
  SortingOrder: number;
  DocumentTypeID: number;
  DocumentID?: number;
  FieldLength: number
  DateModel?: NgbDateStruct;
}

export interface UserDocument {
  DocumentTypeID: number;
  DocumentTypeCode: string;
  DocumentTypeName: string;
  DocumentTypeDesc: string;
  SortingOrder: number;
  DocumentSubProcess: string;
  DocumentID?: number;
  UserID?: number;
  BookingID?: number,
  CompanyID?: number,
  ProviderID?: number,
  DocumentName: string;
  DocumentDesc: string;
  DocumentFileName?: string;
  DocumentFileContent: string;
  DocumentUploadedFileType?: string;
  DocumentLastStatus?: string;
  ExpiryStatusCode: string;
  ExpiryStatusMessage: string;
  DocumentUploadDate?: string;
  IsDownloadable: boolean;
  IsApprovalRequired: boolean;
  MetaInfoKeysDetail: MetaInfoKeysDetail[];
  ShowUpload?: boolean;
  DocumentNature?: string;
  DocumentTypeNameOL?: any;
  WHID?: any;
  VesselID?: any;
  DocumentFile?: any;
  BusinessLogic?: any;
  CopyOfDocTypeID?: any;
  ReasonID?: any;
  ReasonCode?: any;
  ReasonName?: any;
  DocumentStausRemarks?: any;
  IsUploadable?: any;
  FileContent?: any;
  StatusAction?: any;
  ProviderName?: any;
  EmailTo?: any;
  PhoneTo?: any;
  UserName?: any;
  UserCompanyName?: any;
  UserCountryPhoneCode?: any;
  HashMoveBookingNum?: any;
}
