export interface SearchResults {
    total?: number;
    totalPages?: number;
    results: any[]; // todo complete: type of Suggestion
    nextPage?: number;
    isFinished: boolean;
    source: string;
}

export interface SearchSuggestion {
    id: number;
    name: string;
    category: string;
    destination: string;
    image?: string;
}