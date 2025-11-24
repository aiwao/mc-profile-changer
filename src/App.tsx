import {type ChangeEventHandler, useEffect, useRef, useState} from 'react'
import './App.css'
import {
  changeCape, changeName, changeSkin, changeSkinWithURL,
  Data,
  getNameChange, getProfile,
  MC_NAME_REGEX,
  NameChangeResponse,
  ProfileResponse, resetCape, resetSkin
} from "./utils.ts"
import {
  Button,
  ErrorComponent,
  LabeledInput,
  MessageComponent, SkinCapeContainer,
  SkinVariantButton
} from "./components.tsx"

function App() {
  const [token, setToken] = useState("")
  const [name, setName] = useState("")
  const [data, setData] = useState<Data | null>(null)
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null)
  const [nameChangeData, setNameChangeData] = useState<NameChangeResponse | null>(null)
  const [canChangeIn, setCanChangeIn] = useState<string | null>(null)
  const [skinFile, setSkinFile] = useState<File | null>(null)
  const [skinURL, setSkinURL] = useState<string | null>(null)
  const [prioritizeURL, setPrioritizeURL] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [skinUploadError, setSkinUploadError] = useState<string | null>(null)
  const [shadowBottom, setShadowBottom] = useState(true)
  const [skinVariant, setSkinVariant] = useState<"Classic" | "Slim">("Classic")
  const [processError, setProcessError] = useState<string | null>(null)
  const [processMessage, setProcessMessage] = useState<string | null>(null)
  const skinRef = useRef<HTMLDivElement>(null)

  const updateProfile = (newToken: string | null) => {
    if ((newToken ?? token) === "")
      return

    getProfile(newToken ?? token)
      .then(result => {
        setToken(result.extractedToken)
        setTokenError(null)
        setProfileData(result.res)
      })
      .catch((e: Error) => {
        console.log(newToken ?? token)
        setProcessError(e.message)
        setTokenError("Invalid token")
      })

    getNameChange(newToken ?? token)
      .then(result => {
        setNameChangeData(result)
      })
      .catch((e: Error) => {
        setProcessError(e.message)
      })
  }

  useEffect(() => {
    const localData = localStorage.getItem("data")
    if (localData) {
      const result = Data.safeParse(JSON.parse(localData))
      if (result.success) {
        const dataResult = result.data
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData(dataResult)
        setToken(dataResult.token)
        updateProfile(dataResult.token)
      } else {
        console.error(result.error)
      }
    }
  }, [])

  //update data
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(prevState => ({ ...prevState, token }))
  }, [token])

  //set new data to localstorage
  useEffect(() => {
    if (!data) return
    localStorage.setItem("data", JSON.stringify(data))
  }, [data])

  useEffect(() => {
    const timer = setInterval(() => {
      if (nameChangeData) {
        const dateString = nameChangeData.changedAt ?? nameChangeData.createdAt
        const diffTo30DaysLater = (new Date(dateString).getTime() + (30 * 24 * 60 * 60 * 1000)) - Date.now()
        const sec = Math.floor(diffTo30DaysLater / 1000) % 60
        const min = Math.floor(diffTo30DaysLater / 1000 / 60) % 60
        const hour = Math.floor(diffTo30DaysLater / 1000 / 60 / 60) % 24
        const day = Math.floor(diffTo30DaysLater / 1000 / 60 / 60 / 24)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCanChangeIn(`${day}d ${hour}h ${min}m ${sec}s`)
        if (diffTo30DaysLater <= 0)
          setNameChangeData(prevState => ({...prevState!, nameChangeAllowed: true}))
      } else {
        setCanChangeIn(null)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [nameChangeData])

  const onTokenChanged: ChangeEventHandler<HTMLInputElement> = (e) => {
    setToken(e.target.value)
    updateProfile(e.target.value)
  }

  const onNameChanged: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.value.length > 16)
      return

    setName(e.target.value)
    if (!MC_NAME_REGEX.test(e.target.value))
      setNameError("Invalid name")
    else
      setNameError(null)
  }

  const onSkinUploaded: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type === "image/png") {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (img.width === 64 && img.height === 64) {
          setPrioritizeURL(false)
          setSkinUploadError(null)
          setSkinFile(file)
          setSkinURL(url)
        } else {
          setSkinUploadError("Please select a 64x64 png file")
          URL.revokeObjectURL(url);
        }
      };
      img.src = url;
    } else {
      setSkinUploadError("Please select a png file")
    }
  }

  const onSkinURLChanged: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.value === "")
      return
    const img = new Image();
    img.onload = () => {
      if (img.width === 64 && img.height === 64) {
        setPrioritizeURL(true)
        setSkinUploadError(null)
        setSkinURL(e.target.value)
      }
    };
    img.src = e.target.value;
  }

  const onSkinScroll = () => {
    if (skinRef.current) {
      if (skinRef.current.scrollTop > (skinRef.current.scrollHeight-100)/2) {
        setShadowBottom(false)
      } else {
        setShadowBottom(true)
      }
    }
  }

  const onSuccess = (process: string, extracted: string) => {
    setProcessError(null)
    setProcessMessage(`${process} success`)
    updateProfile(extracted)
  }

  const onStartResetSkin = () => {
    resetSkin(token)
      .then(extracted => onSuccess("Reset skin", extracted))
      .catch((e: Error) => {
        setProcessError(e.message)
      })
  }

  const onStartChangeSkin = () => {
    if ((prioritizeURL || !skinFile) && skinURL) {
      onStartChangeSkinWithURL(skinURL)
      return
    }
    onStartChangeSkinWithFile()
  }

  const onStartChangeSkinWithFile = () => {
    changeSkin(skinFile, skinVariant, token)
      .then(extracted => onSuccess("Change skin", extracted))
      .catch((e: Error) => {
        setProcessError(e.message)
      })
  }

  const onStartChangeSkinWithURL = (url: string) => {
    changeSkinWithURL(url, skinVariant, token)
      .then(extracted => onSuccess("Change skin", extracted))
      .catch((e: Error) => {
        setProcessError(e.message)
      })
  }

  const onStartChangeCape = (id: string) => {
    changeCape(id, token)
      .then(extracted => onSuccess("Change cape", extracted))
      .catch((e: Error) => {
        setProcessError(e.message)
      })
  }

  const onStartChangeName = () => {
    changeName(name, token)
      .then(extracted => onSuccess("Change name", extracted))
      .catch((e: Error) => {
        setProcessError(e.message)
      })
  }

  const onStartResetCape = () => {
    resetCape(token)
      .then(extracted => onSuccess("Reset cape", extracted))
      .catch((e: Error) => {
        setProcessError(e.message)
      })
  }

  return (
    <>
      <h1>Minecraft profile changer</h1>
      <div className="p-20 flex flex-col gap-8">
        <LabeledInput label="Session token" value={token} onChange={onTokenChanged} placeholder="input your token"/>
        <ErrorComponent errorMessage={tokenError}/>
        <LabeledInput label="Name" value={name} onChange={onNameChanged} placeholder="input name" />
        <ErrorComponent errorMessage={nameError}/>
        <div className="flex flex-col gap-3 justify-center items-center">
          <LabeledInput label="Skin" type="file" onChange={onSkinUploaded} />
          <LabeledInput onChange={onSkinURLChanged} placeholder="input skin url"  label={null}/>
          {skinURL &&
            <div className="relative w-xl h-[100px]">
              <div className={`${shadowBottom ? "shadow-[0_-35px_40px_rgba(0,0,0,0.5)] top-[100px]" : "shadow-[0_35px_40px_rgba(0,0,0,0.5)] top-[-35px]"} absolute left-0 w-full h-[35px] pointer-events-none`}></div>
              <div className="h-full none-scrollbar overflow-scroll" onScroll={onSkinScroll} ref={skinRef}>
                  <img className="w-xl object-cover" src={skinURL} alt="selected skin"/>
              </div>
            </div>
          }
        </div>
        <div className="flex flex-row justify-between gap-5">
          <SkinVariantButton selected={skinVariant=="Classic"} onClick={() => setSkinVariant("Classic")}>Classic</SkinVariantButton>
          <SkinVariantButton selected={skinVariant=="Slim"} onClick={() => setSkinVariant("Slim")}>Slim</SkinVariantButton>
        </div>
        <ErrorComponent errorMessage={skinUploadError} />
        <Button disabled={!profileData} onClick={onStartResetSkin}>Reset skin</Button>
        <Button disabled={!profileData} onClick={onStartResetCape}>Reset cape</Button>
        <Button disabled={!skinFile && !skinURL} onClick={onStartChangeSkin}>Change skin</Button>
        <Button disabled={!(MC_NAME_REGEX.test(name) && nameChangeData?.nameChangeAllowed)} onClick={onStartChangeName}>Change name</Button>
        <ErrorComponent errorMessage={processError} />
        <MessageComponent message={processMessage}/>
      </div>
      {profileData &&
        <div className="flex flex-col justify-center items-center rounded-lg bg-[#1C1C1C] p-8 gap-8">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-lg font-bold">{profileData.name}</p>
              {
                nameChangeData
                  ? nameChangeData.nameChangeAllowed
                  ? <p className="font-bold text-green-500">You can change the name</p>
                  : (
                    <>
                      {canChangeIn &&
                        <p className="font-bold text-gray-500">
                          You can change the name in <span className="text-red-500">{canChangeIn}</span>
                        </p>
                      }
                    </>
                  )
                  : null
                }
            </div>
            <p>{profileData.id}</p>
          </div>
          <SkinCapeContainer skinsOrCapes={profileData.skins} skin={true} onClickCustom={onStartChangeSkinWithURL}/>
          <SkinCapeContainer skinsOrCapes={profileData.capes} skin={false} onClickCustom={onStartChangeCape}/>
        </div>
      }
    </>
  )
}

export default App
