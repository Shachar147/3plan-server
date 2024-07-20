export interface SearchResults {
    results: any[]; // todo complete: type of Suggestion
    nextPage?: number;
    isFinished: boolean;
    source: string;
}

export interface SearchSuggestion {
    name: string;
    category: string;
    destination: string;
    image?: string;
}