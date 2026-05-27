import { create } from "zustand";

interface QuestionTypeRow {
  id: string;
  type: string;
  numQuestions: number;
  marks: number;
}

interface AssignmentFormData {
  dueDate: string;
  questionTypes: QuestionTypeRow[];
  instructions: string;
  file: File | null;
}

interface AssignmentStore {
  loading: boolean;
  formData: AssignmentFormData;
  assignmentId: string | null;
  result: any;

  setLoading: (v: boolean) => void;
  setFormData: (data: Partial<AssignmentFormData>) => void;
  setAssignmentId: (id: string) => void;
  setResult: (result: any) => void;
  addQuestionType: () => void;
  removeQuestionType: (id: string) => void;
  updateQuestionType: (id: string, field: keyof QuestionTypeRow, value: any) => void;
  reset: () => void;
}

const defaultFormData: AssignmentFormData = {
  dueDate: "",
  questionTypes: [
    { id: "1", type: "Multiple Choice Questions", numQuestions: 4, marks: 1 },
    { id: "2", type: "Short Questions",            numQuestions: 3, marks: 2 },
  ],
  instructions: "",
  file: null,
};

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  loading: false,
  formData: defaultFormData,
  assignmentId: null,
  result: null,

  setLoading: (v) => set({ loading: v }),
  setFormData: (data) =>
    set((s) => ({ formData: { ...s.formData, ...data } })),
  setAssignmentId: (id) => set({ assignmentId: id }),
  setResult: (result) => set({ result }),

  addQuestionType: () =>
    set((s) => ({
      formData: {
        ...s.formData,
        questionTypes: [
          ...s.formData.questionTypes,
          {
            id: Date.now().toString(),
            type: "Short Questions",
            numQuestions: 3,
            marks: 2,
          },
        ],
      },
    })),

  removeQuestionType: (id) =>
    set((s) => ({
      formData: {
        ...s.formData,
        questionTypes: s.formData.questionTypes.filter((q) => q.id !== id),
      },
    })),

  updateQuestionType: (id, field, value) =>
    set((s) => ({
      formData: {
        ...s.formData,
        questionTypes: s.formData.questionTypes.map((q) =>
          q.id === id ? { ...q, [field]: value } : q
        ),
      },
    })),

  reset: () => set({ formData: defaultFormData, result: null, assignmentId: null }),
}));