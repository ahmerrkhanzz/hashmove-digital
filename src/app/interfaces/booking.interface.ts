export interface BookingDocumentDetail {
  DocumentTypeID: number;
  DocumentTypeCode: string;
  DocumentTypeName: string;
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
  DocumentFileName?: string;
  DocumentFileContent: string;
  DocumentUploadedFileType?: any;
  DocumentLastStatus?: any;
  ExpiryStatusCode: string;
  ExpiryStatusMessage: string;
  DocumentUploadDate?: any;
  IsDownloadable: boolean;
  IsApprovalRequired: boolean;
  MetaInfoKeysDetail?: any;
  IsUploadable: boolean;
  BusinessLogic: string;
  CopyOfDocTypeID: number;
  ReasonID?: number;
  ReasonCode?: string;
  ReasonName?: string;
  DocumentStausRemarks?: string;
  StatusAction?: string;
}

