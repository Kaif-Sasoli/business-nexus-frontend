import React, { useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  getFileUrl,
  addSignature,
  getEntrepreneurStorage,
} from "../../api/document";
import toast from "react-hot-toast";
import { Document as PDFDoc, Page, pdfjs } from "react-pdf";

// required for react-pdf worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface DocumentType {
  _id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  shared: boolean;
  path?: string;
  url?: string;
  signature?: string;
}

interface StorageType {
  used: number;
  available: number;
  limit: number;
}

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [storage, setStorage] = useState<StorageType | null>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Preview states
  const [previewDoc, setPreviewDoc] = useState<DocumentType | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  // Load docs + storage on mount
  useEffect(() => {
    setFetching(true);
    Promise.all([getDocuments(), getEntrepreneurStorage()])
      .then(([docs, storageData]) => {
        setDocuments(docs);
        setStorage(storageData);
      })
      .catch((err) => console.error("Error fetching:", err))
      .finally(() => setFetching(false));
  }, []);

  // Handle upload
  const handleUpload = async () => {
    if (!file || !docName.trim()) return;
    setLoading(true);
    try {
      const uploaded = await uploadDocument(file, docName);
      setDocuments((prev) => [...prev, uploaded.doc]);
      toast.success("Document uploaded successfully");

      // refresh storage after upload
      const storageData = await getEntrepreneurStorage();
      setStorage(storageData);

      setOpen(false);
      setFile(null);
      setDocName("");
    } catch (err) {
      toast.error(`Upload failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));

      // refresh storage after delete
      const storageData = await getEntrepreneurStorage();
      setStorage(storageData);

      toast.success("Document deleted successfully");
    } catch (err) {
      toast.error(`Delete failed: ${err}`);
    }
  };

  // Handle signature upload
  const handleAddSignature = async (docId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event: any) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const updated = await addSignature(docId, file);
        setDocuments((prev) =>
          prev.map((d) => (d._id === docId ? updated.doc : d))
        );
        if (previewDoc && previewDoc._id === docId) {
          setPreviewDoc(updated.doc);
        }
        toast.success("Signature added");
      } catch (err) {
        toast.error("Signature upload failed");
      }
    };
    input.click();
  };

  // Convert bytes → GB with 1 decimal
  const formatGB = (bytes: number) => (bytes / (1024 ** 3)).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files</p>
        </div>

        {/* Upload Button */}
        <Button leftIcon={<Upload size={18} />} onClick={() => setOpen(true)}>
          Upload Document
        </Button>
      </div>

      {/* Upload Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter document name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded"
            />
            <Button
              onClick={handleUpload}
              disabled={loading || !file || !docName.trim()}
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage info */}
       <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {storage ? (
              <>
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm mt-2 text-gray-700">
                    <span>Used</span>
                    <span>{formatGB(storage.used)} GB</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(storage.used / storage.limit) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Available</span>
                    <span>{formatGB(storage.available)} GB</span>
                  </div>
                </div       >

                {/* Quick Access */}
                <div className="border-t pt-3 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-800">Quick Access</h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="hover:text-primary-600 cursor-pointer">Recent Files</li>
                    <li className="hover:text-primary-600 cursor-pointer">Shared with Me</li>
                    <li className="hover:text-primary-600 cursor-pointer">Starred</li>
                    <li className="hover:text-primary-600 cursor-pointer">Trash</li>
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Loading storage...</p>
            )}
          </CardBody>
        </Card>

        {/* Document list */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                All Documents
              </h2>
            </CardHeader>
            <CardBody>
              {fetching ? (
                <div className="flex justify-center items-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">
                    Loading documents...
                  </span>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <FileText
                    size={40}
                    className="mx-auto mb-3 text-gray-400"
                  />
                  <p>No documents have been added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc._id}
                      onClick={() => {
                        setPreviewDoc(doc);
                        setPageNumber(1);
                      }}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                      <div className="p-2 bg-primary-50 rounded-lg mr-4">
                        <FileText
                          size={24}
                          className="text-primary-600"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          {doc.shared && (
                            <Badge variant="secondary" size="sm">
                              Shared
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{doc.type}</span>
                          <span>
                            {(doc.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <span>
                            Modified{" "}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {/* ✅ Download button */}
                        <a
                          href={`${import.meta.env.VITE_BASE_URL}/document/download/${doc._id}`}
                          className="p-2 text-gray-600 hover:text-primary-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download size={18} />
                        </a>

                        <Button variant="ghost" size="sm" className="p-2">
                          <Share2 size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-error-600 hover:text-error-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc._id);
                          }}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle>{previewDoc?.name}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewDoc(null)}
            >
              <X size={20} />
            </Button>
          </DialogHeader>

          {previewDoc && (
            <div className="flex flex-col items-center">
              {/pdf/i.test(previewDoc.type || "") ||
              /\.pdf$/i.test(previewDoc.name) ? (
                <PDFDoc
                  file={getFileUrl(previewDoc.path)}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  onLoadError={(err) =>
                    console.error("PDF load error", err)
                  }
                >
                  <Page pageNumber={pageNumber} width={600} />
                </PDFDoc>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600">Preview not available.</p>
                  <a
                    href={`${import.meta.env.VITE_BASE_URL}/document/download/${previewDoc._id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 mt-3 text-white bg-primary-600 rounded hover:bg-primary-700"
                  >
                    <Download size={18} />
                    Download
                  </a>
                </div>
              )}

              {/* Pagination */}
              {numPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPageNumber((p) => Math.max(p - 1, 1))
                    }
                    disabled={pageNumber <= 1}
                  >
                    <ChevronLeft size={18} />
                    Prev
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pageNumber} of {numPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPageNumber((p) => Math.min(p + 1, numPages))
                    }
                    disabled={pageNumber >= numPages}
                  >
                    Next
                    <ChevronRight size={18} />
                  </Button>
                </div>
              )}

              {/* Signature Section */}
              <div className="mt-6 w-full text-center">
                {previewDoc.signature ? (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Signature
                    </h3>
                    <img
                      src={getFileUrl(previewDoc.signature)}
                      alt="Signature"
                      className="mt-2 mx-auto max-h-32 border rounded"
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-2">
                    No signature added yet
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSignature(previewDoc._id)}
                >
                  ✍️ Add Signature
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
