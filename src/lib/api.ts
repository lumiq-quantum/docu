
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

export async function getPageTextContent(projectId: number, pageNumber: number): Promise<PageResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/text`);
  return handleResponse<PageResponse>(response);
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

// Modified to ensure only ChatMessageCreate properties are sent
export async function postChatMessage(projectId: number, messageData: ChatMessageCreate): Promise<ChatMessageResponse> {
  // Ensure only properties of ChatMessageCreate are sent
  const { message, is_user_message } = messageData;
  const payload: ChatMessageCreate = { message, is_user_message };

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<ChatMessageResponse>(response);
}


export async function getChatHistory(projectId: number): Promise<ChatMessageResponse[]> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/chat/`);
  return handleResponse<ChatMessageResponse[]>(response);
}
