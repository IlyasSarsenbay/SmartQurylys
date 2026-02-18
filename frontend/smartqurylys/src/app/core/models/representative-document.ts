import { FileResponse } from './file';

export interface RepresentativeDocumentResponse extends FileResponse {
    reviewStatus: string;
    rejectionReason?: string;
}
