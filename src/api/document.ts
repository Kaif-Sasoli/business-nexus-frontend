import { apiClient } from "./index";

export const getDocuments = async () => {
  const res = await apiClient.get("/document");
  return res.data;
};


export const uploadDocument = async (file: File, name: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name); 

  const res = await apiClient.post("/document/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteDocument = async (id: string) => {
  const res = await apiClient.delete(`/document/${id}`);
  return res.data;
};


export const getFileUrl = (p: string) => {
if (!p) return "";
   if (/^https?:\/\//i.test(p)) return p; // already absolute
   const base = (apiClient.defaults.baseURL || "").replace(/\/$/, "");
   return `${base}${p.startsWith("/") ? p : `/${p}`}`;
    };


export const addSignature = async (docId: string, file: File) => {
  const formData = new FormData();
  formData.append("signature", file);

  const res = await apiClient.post(`/document/${docId}/signature`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Fetch entrepreneur storage usage
export const getEntrepreneurStorage = async () => {
  const res = await apiClient.get("/document/storage"); 
  return res.data;
};