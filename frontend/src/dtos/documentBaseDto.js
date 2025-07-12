// src/dto/documentBaseDto.js
export const CreateDocumentBaseRequest = {
  base_name: "", // string, required
  company_id: "", // string, optional (mutually exclusive with owner_user_id)
};

export const UpdateDocumentBaseRequest = {
  base_name: "", // string, optional
  status: "" // string, optional (Active, Inactive, Archived)
};

export const DocumentBaseResponse = {
  document_base_id: "",
  base_name: "",
  company_id: "",
  owner_user_id: null,
  created_by_user_id: "",
  creation_date: "",
  last_modified_by_user_id: "",
  last_modification_date: "",
  status: ""
};

// src/dto/folderDto.js
export const CreateFolderRequest = {
  folder_name: "", // string, required
  document_base_id: "", // string, required
  parent_folder_id: "" // string, optional
};

export const UpdateFolderRequest = {
  folder_name: "" // string, required (sent as query parameter)
};

export const FolderResponse = {
  folder_id: "",
  folder_name: "",
  document_base_id: "",
  parent_folder_id: "",
  status: "",
  creation_date: "",
  created_by_user_id: ""
};

// src/dto/documentDto.js
export const CreateDocumentRequest = {
  document_name: "", // string, required
  document_base_id: "", // string, required
  storage_url: "", // string, required
  file_type: "", // string, required
  size_mb: 0, // decimal, required
  folder_id: "", // string, optional
  num_pages: 0 // integer, optional
};

export const UpdateDocumentRequest = {
  document_name: "" // string, required (sent as query parameter)
};

export const DocumentResponse = {
  document_id: "",
  document_name: "",
  document_base_id: "",
  folder_id: "",
  storage_url: "",
  file_type: "",
  size_mb: 0,
  status: "",
  vectorization_status: "",
  creation_date: "",
  created_by_user_id: "",
  num_pages: 0
};

// src/dto/apiResponse.js
export const ApiResponse = {
  success: false,
  message: "",
  data: null,
  error: null
};