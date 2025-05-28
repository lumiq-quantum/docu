import type {
  ProjectResponse,
  PageResponse,
  FormDataCreate,
  FormDataResponse,
  ChatMessageCreate,
  ChatMessageResponse,
  HTTPValidationError,
  GeneratedFormFields, // Added for the new API endpoint
  GeneratedHtmlResponse, // Added for the new API endpoint
  ChatHistoryResponse, // Added this line
} from '@/types/api';
import { API_BASE_URL } from '@/lib/config';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: HTTPValidationError | { error: string } | string = { error: `HTTP error! status: ${response.status}` };
    try {
      errorData = await response.json();
    } catch (e) {
      // If parsing JSON fails, use the status text or a generic message
      errorData = { error: response.statusText || `HTTP error! status: ${response.status}` };
    }
    
    let errorMessage = `HTTP error! status: ${response.status}`;
    if (typeof errorData === 'string') {
      errorMessage = errorData;
    } else if ('detail' in errorData && errorData.detail && errorData.detail.length > 0) {
      errorMessage = errorData.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join('; ');
    } else if ('error' in errorData) {
      errorMessage = errorData.error;
    }
    
    throw new Error(errorMessage);
  }
  if (response.status === 204) { // No Content
    return null as T;
  }
  return response.json() as Promise<T>;
}


export async function listProjects(): Promise<ProjectResponse[]> {
  const response = await fetch(`${API_BASE_URL}/projects/`);
  return handleResponse<ProjectResponse[]>(response);
}

export async function createProject(file: File): Promise<ProjectResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/projects/`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProjectResponse>(response);
}

export async function getProject(projectId: number): Promise<ProjectResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
  return handleResponse<ProjectResponse>(response);
}

export async function deleteProject(projectId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
  });
  await handleResponse<void>(response); // Expects 204 No Content
}

export async function listProjectPages(projectId: number): Promise<PageResponse[]> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pages/`);
  return handleResponse<PageResponse[]>(response);
}

// We will use it to fetch text content. Actual PDF visual display is not directly supported by this endpoint.
export async function getPageTextContent(projectId: number, pageNumber: number): Promise<PageResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/text`);
  return handleResponse<PageResponse>(response);
}

export async function getPdfPageDisplayUrl(projectId: number, pageNumber: number): Promise<string> {
  // This function will now return the direct URL to the PDF content.
  return `${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/pdf`;
}

// New API function to trigger form field generation
export async function generateFormFieldsAPI(projectId: number, pageNumber: number): Promise<GeneratedFormFields> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/form/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // Assuming it might take an empty body or specific params
    // body: JSON.stringify({}), // If the endpoint expects a JSON body, even if empty
  });
  // Assuming this endpoint returns GeneratedFormFields JSON similar to the old Genkit flow
  return handleResponse<GeneratedFormFields>(response);
}

// New API function to get generated form HTML (might not be used if generateFormFieldsAPI returns field definitions)
export async function getGeneratedFormHtmlAPI(projectId: number, pageNumber: number): Promise<GeneratedHtmlResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/form/html`);
  return handleResponse<GeneratedHtmlResponse>(response);
}


export async function saveFormData(projectId: number, pageNumber: number, data: FormDataCreate): Promise<FormDataResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/form`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<FormDataResponse>(response);
}

export async function getFormData(projectId: number, pageNumber: number): Promise<FormDataResponse | null> {
 try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/form`);
    if (response.status === 404) { // Assuming 404 means no form data yet
      return null;
    }
    return handleResponse<FormDataResponse>(response);
  } catch (error) {
    console.error("Error fetching form data:", error);
    return null; 
  }
}

// Modified to use FormData and a session-specific endpoint as per new requirements.
// Note: The CHAT_API_BASE_URL is hardcoded to 'http://localhost:8090' based on the curl command provided.
// The response type ChatMessageResponse is assumed to be the same.
export async function postChatMessage(sessionId: string, messageText: string): Promise<ChatMessageResponse> {
  const CHAT_API_BASE_URL = 'http://localhost:8090'; // Base URL for the chat service

  const formData = new FormData();
  formData.append('message', messageText);

  const response = await fetch(`${CHAT_API_BASE_URL}/chat/${sessionId}/message`, {
    method: 'POST',
    body: formData,
    // Content-Type header is not needed here; the browser sets it automatically for FormData
  });

  // Assuming handleResponse and ChatMessageResponse are still appropriate for the new endpoint's response.
  // If the response structure has changed, ChatMessageResponse and handleResponse might need adjustments.
  return handleResponse<ChatMessageResponse>(response);
}

// Updated to use the new endpoint and accept chat_session_id
export async function getChatHistory(chat_session_id: string): Promise<ChatHistoryResponse> {
  const CHAT_API_BASE_URL = 'http://localhost:8090'; // Base URL for the chat service
  const response = await fetch(`${CHAT_API_BASE_URL}/chat/${chat_session_id}/history`);
  return handleResponse<ChatHistoryResponse>(response);
}
