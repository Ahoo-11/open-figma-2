import React, { createContext, useContext, useReducer, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import backend from "~backend/client";
import type { Project } from "~backend/design/create_project";
import { DesignElement, ToolType } from "../types/design";

interface DesignState {
  elements: DesignElement[];
  selectedElementId: string | null;
  activeTool: ToolType;
  canvasSize: { width: number; height: number };
  project: Project | null;
}

type DesignAction =
  | { type: "SET_ELEMENTS"; elements: DesignElement[] }
  | { type: "ADD_ELEMENT"; element: DesignElement }
  | { type: "UPDATE_ELEMENT"; id: string; updates: Partial<DesignElement> }
  | { type: "DELETE_ELEMENT"; id: string }
  | { type: "SET_SELECTED_ELEMENT"; id: string | null }
  | { type: "SET_ACTIVE_TOOL"; tool: ToolType }
  | { type: "SET_CANVAS_SIZE"; size: { width: number; height: number } };

const initialState: DesignState = {
  elements: [],
  selectedElementId: null,
  activeTool: "select",
  canvasSize: { width: 1200, height: 800 },
  project: null,
};

function designReducer(state: DesignState, action: DesignAction): DesignState {
  switch (action.type) {
    case "SET_ELEMENTS":
      return { ...state, elements: action.elements };
    case "ADD_ELEMENT":
      return { ...state, elements: [...state.elements, action.element] };
    case "UPDATE_ELEMENT":
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id ? { ...el, ...action.updates } : el
        ),
      };
    case "DELETE_ELEMENT":
      return {
        ...state,
        elements: state.elements.filter((el) => el.id !== action.id),
        selectedElementId: state.selectedElementId === action.id ? null : state.selectedElementId,
      };
    case "SET_SELECTED_ELEMENT":
      return { ...state, selectedElementId: action.id };
    case "SET_ACTIVE_TOOL":
      return { ...state, activeTool: action.tool };
    case "SET_CANVAS_SIZE":
      return { ...state, canvasSize: action.size };
    default:
      return state;
  }
}

interface DesignContextType extends DesignState {
  addElement: (element: DesignElement) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  deleteElement: (id: string) => void;
  setSelectedElementId: (id: string | null) => void;
  setActiveTool: (tool: ToolType) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  saveProject: () => Promise<void>;
}

const DesignContext = createContext<DesignContextType | null>(null);

export function useDesignContext() {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error("useDesignContext must be used within a DesignProvider");
  }
  return context;
}

interface DesignProviderProps {
  children: React.ReactNode;
  project: Project | null;
}

export function DesignProvider({ children, project }: DesignProviderProps) {
  const [state, dispatch] = useReducer(designReducer, {
    ...initialState,
    project,
    elements: project?.data?.elements || [],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("No project to save");
      
      await backend.design.updateProject({
        id: project.id,
        data: {
          elements: state.elements,
          canvasSize: state.canvasSize,
        },
      });
    },
  });

  const addElement = useCallback((element: DesignElement) => {
    dispatch({ type: "ADD_ELEMENT", element });
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    dispatch({ type: "UPDATE_ELEMENT", id, updates });
  }, []);

  const deleteElement = useCallback((id: string) => {
    dispatch({ type: "DELETE_ELEMENT", id });
  }, []);

  const setSelectedElementId = useCallback((id: string | null) => {
    dispatch({ type: "SET_SELECTED_ELEMENT", id });
  }, []);

  const setActiveTool = useCallback((tool: ToolType) => {
    dispatch({ type: "SET_ACTIVE_TOOL", tool });
  }, []);

  const setCanvasSize = useCallback((size: { width: number; height: number }) => {
    dispatch({ type: "SET_CANVAS_SIZE", size });
  }, []);

  const saveProject = useCallback(async () => {
    await saveMutation.mutateAsync();
  }, [saveMutation]);

  const value: DesignContextType = {
    ...state,
    addElement,
    updateElement,
    deleteElement,
    setSelectedElementId,
    setActiveTool,
    setCanvasSize,
    saveProject,
  };

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}
