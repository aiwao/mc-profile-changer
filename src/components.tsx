import type {ButtonHTMLAttributes, InputHTMLAttributes} from "react";

interface TextureImage {
  id: string,
  state: string,
  url: string,
  alias: string
}

interface Skin {
  id: string,
  state: string,
  url: string,
  textureKey: string,
  variant: string
}

interface Cape {
  id: string,
  state: string,
  url: string,
  alias: string
}

export function SkinCapeContainer({skinsOrCapes, skin, onClickCustom}: {skinsOrCapes: Skin[] | Cape[], skin: boolean, onClickCustom: (idOrURL: string) => void}) {
  let textureImages: TextureImage[]
  if (skin) {
    textureImages = Array.from(skinsOrCapes as Skin[]).map(skinImg => ({id: skinImg.id, state: skinImg.state, url: skinImg.url, alias: ""}))
  } else {
    textureImages = Array.from(skinsOrCapes as Cape[]).map(capeImg => ({id: capeImg.id, state: capeImg.state, url: capeImg.url, alias: capeImg.alias}))
  }
  return(
    <>
      {textureImages.length > 0 &&
          <div>
              <p className="text-lg font-bold">{skin ? "Skin" : "Cape"} ({textureImages.length})</p>
              <div className="texture-image-container gap-5">
                {
                  Array.from(textureImages)
                    .sort((a, b) => {
                      if (a.state === "ACTIVE" && b.state === "ACTIVE") return 0
                      return a.state === "ACTIVE" ? -1 : 1
                    })
                    .map(texImg =>
                      <SkinCapeButton textureImage={texImg} onClick={() => onClickCustom(skin ? texImg.url : texImg.id)} />
                    )
                }
              </div>
          </div>
      }
    </>
  )
}

export function SkinCapeButton({textureImage, onClick}: {textureImage: TextureImage, onClick: () => void}) {
  const active = textureImage.state === "ACTIVE"
  return(
    <div className={
     `${active ? "drop-shadow-lg drop-shadow-indigo-500/50" : "cursor-pointer"}
      flex flex-col p-2 rounded-lg bg-[#000000] justify-center items-center`
    } onClick={!active ? () => {onClick()} : ()=>{}}>
      <p className="font-thin text-xs">{active ? "Active" : "Inactive"}</p>
      <img className="drop-shadow-lg drop-shadow-gray-500" src={textureImage.url} alt={textureImage.id}/>
    </div>
  )
}

interface LabeledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string | null;
}

export function LabeledInput({label, ...props}: LabeledInputProps) {
  return(
    <div>
      {label && <p>{label}</p>}
      <input type={props.type ?? "text"} value={props.value} onChange={props.onChange} placeholder={props.placeholder}
             className="drop-shadow-lg drop-shadow-indigo-500/50 rounded-lg bg-[#1C1C1C] w-xl text-center focus:outline-none"></input>
    </div>
  )
}

interface SkinVariantButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
}

export function SkinVariantButton({ selected, ...props }: SkinVariantButtonProps) {
  return(
    <>
      <button className={`${selected && "drop-shadow-lg drop-shadow-indigo-500/50" } w-3xs focus:outline-none`} onClick={props.onClick}>{props.children}</button>
    </>
  )
}

export function Button({...props}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return(
    <>
      <button className={props.disabled ? "text-gray-500" : "drop-shadow-lg drop-shadow-indigo-500/50"} disabled={props.disabled} onClick={props.onClick}>{props.children}</button>
    </>
  )
}

export function ErrorComponent({errorMessage}: {errorMessage: string | null}) {
  return(
    <>
      {errorMessage && <p className="font-bold text-red-500">{errorMessage}</p>}
    </>
  )
}

export function MessageComponent({message}: {message: string | null}) {
  return(
    <>
      {message && <p className="font-bold text-green-500">{message}</p>}
    </>
  )
}