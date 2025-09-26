export interface DashboardData {
  totalDocuments: number;
  totalUsers: number;
  recentDocuments: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    createdAt: string;
    createdBy: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export interface DeleteDialog {
  open: boolean;
  docId: string;
  docTitle: string;
}

export interface DeleteResult {
  success: boolean;
  docId: string;
}