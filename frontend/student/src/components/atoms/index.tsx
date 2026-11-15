import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react'
export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} type={props.type ?? 'button'} className={'button ' + (props.className ?? '')} /> }
export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className="grid gap-2 text-sm font-semibold">{label}<input {...props} className="input" /></label> }
