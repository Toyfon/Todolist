import {ResponseTaskType, tasksAPI, TaskStatuses, UpdateTaskModelType} from "../../api/tasksApi";
import {AddTodoListACType, RemoveTodoListACType, SetTodoListsACType} from "./todo-reducer";
import {RootReducerType} from "../../app/Redux-store";
import {ThunkDispatch} from "redux-thunk";
import {SetErrorActionType, setStatus, SetStatusActionType} from "../../app/app-reducer";
import {handleServerAppError, handleServerNetworkError} from "../../helpers/error-helpers";


export let initialState: TaskStateType = {}

export const taskReducer = (state = initialState, action: ActionsType): TaskStateType => {
    switch (action.type) {
        case 'TASKS/REMOVE-TASK':
            return {
                ...state, [action.payload.todolistId]: state[action.payload.todolistId].filter(t =>
                    t.id !== action.payload.taskId)
            }
        case 'TASKS/ADD-TASK':
            return {
                ...state,
                [action.payload.task.todoListId]: [action.payload.task, ...state[action.payload.task.todoListId]]
            }
        case 'TASKS/CHANGE-TASK-STATUS':
            return {
                ...state, [action.payload.todolistId]: state[action.payload.todolistId].map(t =>
                    t.id === action.payload.taskId ? {...t, status: action.payload.status} : t)
            }
        case 'TASKS/CHANGE-TASK-TITLE':
            return {
                ...state, [action.payload.todolistId]: state[action.payload.todolistId].map(t =>
                    t.id === action.payload.taskId ? {...t, title: action.payload.title} : t)
            }
        case "TASKS/SET_TASKS":
            return {...state, [action.payload.todoListId]: action.payload.tasks}
        case "TODOS/ADD-TODOLIST":
            return {...state, [action.payload.todolist.id]: []}
        case "TODOS/REMOVE-TODOLIST":
            const copyState = {...state}
            delete copyState[action.payload.id]
            return copyState
        case 'TODOS/SET-TODOS': {
            const stateCopy = {...state}
            action.todos.forEach((tl) => {
                stateCopy[tl.id] = []
            })
            return stateCopy;
        }
        default:
            return state
    }
}


// Action Creators
export const RemoveTaskAC = (taskId: string, todolistId: string) => ({
    type: 'TASKS/REMOVE-TASK',
    payload: {taskId, todolistId}
} as const)
export const AddTaskAC = (task: ResponseTaskType) => ({type: 'TASKS/ADD-TASK', payload: {task}} as const)
export const ChangeTaskStatusAC = (status: TaskStatuses, taskId: string, todolistId: string) =>
    ({
        type: 'TASKS/CHANGE-TASK-STATUS',
        payload: {
            status,
            taskId,
            todolistId
        }
    } as const)
export const ChangeTaskTitleAC = (title: string, taskId: string, todolistId: string) =>
    ({
        type: 'TASKS/CHANGE-TASK-TITLE',
        payload: {
            title,
            taskId,
            todolistId
        }
    } as const)
export const SetTaskAC = (tasks: Array<ResponseTaskType>, todoListId: string) =>
    ({type: 'TASKS/SET_TASKS', payload: {tasks, todoListId}} as const)


//Thunk Creators
export const getTasks = (todoListId: string) => {
    return async (dispatch: ThunkDispatch<RootReducerType, unknown, ActionsType | SetStatusActionType>) => {
        try {
            dispatch(setStatus('loading'))
            let data = await tasksAPI.getTasks(todoListId)
            dispatch(SetTaskAC(data.items, todoListId))
            dispatch(setStatus('succeeded'))

        } catch (e: any) {
            console.warn(e)
        }
    }
}
export const deleteTask = (taskId: string, todolistId: string) => {
    return async (dispatch: ThunkDispatch<RootReducerType, unknown, ActionsType>) => {
        try {
            let {data} = await tasksAPI.deleteTask(todolistId, taskId)
            if (data.resultCode === 0) {
                dispatch(RemoveTaskAC(taskId, todolistId))
            }
        } catch (e: any) {
            throw new Error('что то не так')
        }
    }
}
export const createFetchedTask = (title: string, todolistId: string) => {
    return async (dispatch: ThunkDispatch<RootReducerType, unknown, ActionsType | SetStatusActionType>) => {
        try {
            dispatch(setStatus('loading'))
            let {data} = await tasksAPI.createTask(todolistId, title)
            if (data.resultCode === 0) {
                dispatch(AddTaskAC(data.data.item))
                dispatch(setStatus('succeeded'))
            } else {
                handleServerAppError(data,dispatch)
            }
        } catch (e: any) {
            handleServerNetworkError(e,dispatch)
        }
    }
}
export const updateFetchedTaskStatus = (todolistId: string, taskId: string, status: TaskStatuses) => {
    return async (dispatch: ThunkDispatch<RootReducerType, unknown, ActionsType | SetStatusActionType>,
                  getState: () => RootReducerType) => {
        const state = getState()
        const task = state.tasks[todolistId].find(t => t.id === taskId)
        if (!task) {
            console.warn("task not found in the state")
            return
        }
        const model: UpdateTaskModelType = {
            status: status,
            title: task.title,
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
        }
        try {
            await tasksAPI.updateTaskStatus(todolistId, taskId, model)
            dispatch(ChangeTaskStatusAC(status, taskId, todolistId))
        } catch (e: any) {
            console.warn('Error')
        }
    }
}
export const updateFetchedTaskTitle = (todolistId: string, taskId: string, title: string) => {
    return async (dispatch: ThunkDispatch<RootReducerType, unknown, ActionsType | SetStatusActionType>, getState: () => RootReducerType) => {
        const state = getState()
        const task = state.tasks[todolistId].find(t => t.id === taskId)
        if (!task) {
            console.warn("task not found in the state")
            return
        }
        const model: UpdateTaskModelType = {
            status: task.status,
            title: title,
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
        }
        try {
            let {data} = await tasksAPI.updateTaskTitle(todolistId, taskId, model)
            if (data.resultCode === 0) {
                dispatch(ChangeTaskTitleAC(title, taskId, todolistId))
            } else {
                handleServerAppError(data,dispatch)
            }
        } catch (e: any) {
            handleServerNetworkError(e,dispatch)
        }
    }
}

// types
export type ActionsType =
    | ReturnType<typeof RemoveTaskAC>
    | ReturnType<typeof AddTaskAC>
    | ReturnType<typeof ChangeTaskStatusAC>
    | ReturnType<typeof ChangeTaskTitleAC>
    | ReturnType<typeof SetTaskAC>
    | SetTodoListsACType
    | AddTodoListACType
    | RemoveTodoListACType
    | SetErrorActionType

export type TaskStateType = {
    [key: string]: Array<ResponseTaskType>
}
