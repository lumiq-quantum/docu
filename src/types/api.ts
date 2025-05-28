export interface ProjectResponse {
  id: number;
  name: string;
  total_pages: number;
  chat_session_id: string; // Added chat_session_id
  created_at: string; // ISO date string
}

export interface PageResponse {
  id: number;
  page_number: number;
  text_content: string;
  generated_form_html: string | null; // Added as per new spec
}

export interface FormDataCreate {
  data: string; // JSON stringified object
}

export interface FormDataResponse {
  id: number;
  data: string; // JSON stringified object
  page_id: number;
}

export interface ChatMessageCreate {
  message: string;
  is_user_message: number; // 0 for AI, 1 for user
}

export interface ChatMessageResponse {
  id: number;
  message: string;
  is_user_message: number; // 0 for AI, 1 for user
  created_at: string; // ISO date string
  project_id: number;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

// For AI-generated form fields (matches generateFormFields output)
export type FormFieldType = 
  | "text" 
  | "multi-line text" 
  | "checkbox" 
  | "radio" // Assuming radio button maps to "radio"
  | "dropdown";

export interface FormFieldDefinition {
  type: FormFieldType;
  label?: string; // Optional label, can be inferred from key
  options?: string[]; // For radio, checkbox (if multiple), dropdown
}

export type GeneratedFormFields = Record<string, FormFieldDefinition>;

// For storing form data, key is field name, value is field value
export type FormValues = Record<string, string | boolean | number | string[]>;

// New type based on OpenAPI spec
export interface GeneratedHtmlResponse {
  html_content: string;
}

export interface ChatMessage {
  id: string | number; // Unique identifier for the message
  role: "user" | "model"; // Role of the message sender
  content: string; // Content of the message
  timestamp: string; // ISO string format for when the message was created/received
  file_uri?: string | null;
  file_mime_type?: string | null;
}

export interface ChatSessionInfo {
  id: string;
  title: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  session: ChatSessionInfo;
  messages: ChatMessage[];
}

export interface FormField {
  // ...existing properties
}
