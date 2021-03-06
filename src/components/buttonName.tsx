import React from "react";

type ButtonType = {
    callBack: () => void,
    name:string
    classes?: string

}

export const ButtonName = (props:ButtonType) => {

   const onClickHandler = () => {
       props.callBack()
   }
    return <button className={props.classes} onClick={onClickHandler}>{props.name}</button>
}