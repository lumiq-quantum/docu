import type {
  ProjectResponse,
  PageResponse,
  FormDataCreate,
  FormDataResponse,
  ChatMessageCreate,
  ChatMessageResponse,
  HTTPValidationError,
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

//This API endpoint returns JSON, not a PDF file.
//We will use it to fetch text content. Actual PDF visual display is not directly supported by this endpoint.
export async function getPageTextContent(projectId: number, pageNumber: number): Promise<PageResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/text`);
  return handleResponse<PageResponse>(response);
}


export async function getPdfPageDisplayUrl(projectId: number, pageNumber: number): Promise<string> {
  // The swagger indicates /pdf returns JSON. This is unusual for displaying a PDF.
  // We will assume for now that the backend *should* serve a PDF at a similar URL,
  // or this function would fetch data to construct a displayable PDF (e.g., base64 image).
  // For this implementation, we'll return a direct URL, assuming the backend handles it.
  // In a real scenario, this might need to fetch the actual PDF file or image data.
  return `${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/pdf-raw-display`; // Placeholder URL
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
    // If any other error, or if 404 should be treated as error by handleResponse
    console.error("Error fetching form data:", error);
    // Depending on requirements, you might want to re-throw or return null/specific error state
    return null; 
  }
}

export async function postChatMessage(projectId: number, messageData: ChatMessageCreate): Promise<ChatMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData),
  });
  // Note: The AI response part is handled by calling the answerQuestionsAboutDocument server action.
  // This `postChatMessage` is likely to save the user's message and potentially the AI's response after it's generated.
  // The current swagger for this endpoint returns a ChatMessageResponse, which might be the saved user message or AI message.
  return handleResponse<ChatMessageResponse>(response);
}


export async function getChatHistory(projectId: number): Promise<ChatMessageResponse[]> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/chat/`);
  return handleResponse<ChatMessageResponse[]>(response);
}
