import {z} from "zod";

export const Data = z.object({
  token: z.string(),
})
export type Data = z.infer<typeof Data>

export const ProfileResponse = z.object({
  id: z.string(),
  name: z.string(),
  skins: z.array(z.object({
    id: z.string(),
    state: z.string(),
    url: z.string(),
    textureKey: z.string(),
    variant: z.string(),
  })),
  capes: z.array(z.object({
    id: z.string(),
    state: z.string(),
    url: z.string(),
    alias: z.string(),
  })),
})
export type ProfileResponse = z.infer<typeof ProfileResponse>

export const NameChangeResponse = z.object({
  changedAt: z.string().optional(),
  createdAt: z.string(),
  nameChangeAllowed: z.boolean(),
})
export type NameChangeResponse = z.infer<typeof NameChangeResponse>

const BASE_URL = import.meta.env.MODE === "development" ? "/api/" : "https://api.minecraftservices.com/minecraft/"

//profile
const ENDPOINT_PROFILE = "profile/"
const ENDPOINT_NAME = ENDPOINT_PROFILE+"name/"
const ENDPOINT_NAME_CHANGE = ENDPOINT_PROFILE+"namechange/"
const ENDPOINT_SKINS = ENDPOINT_PROFILE+"skins/"
const ENDPOINT_SKINS_ACTIVE = ENDPOINT_SKINS+"active/"
const ENDPOINT_CAPES = ENDPOINT_PROFILE+"capes/"
const ENDPOINT_CAPES_ACTIVE = ENDPOINT_CAPES+"active/"

const PROFILE_URL = BASE_URL+ENDPOINT_PROFILE
const NAME_URL = BASE_URL+ENDPOINT_NAME
const NAME_CHANGE_URL = BASE_URL+ENDPOINT_NAME_CHANGE
const SKINS_URL = BASE_URL+ENDPOINT_SKINS
const SKINS_ACTIVE_URL = BASE_URL+ENDPOINT_SKINS_ACTIVE
const CAPES_ACTIVE_URL = BASE_URL+ENDPOINT_CAPES_ACTIVE

export const MC_NAME_REGEX = /^[A-Za-z0-9_]{3,16}$/

function extractToken(token: string): string | null {
  const index = token.indexOf("eyJraWQiOiIwNDkxODEiLCJhbGciOiJSUzI1NiJ9")
  if (index === -1) return null
  return token.slice(index)
}

function formatProcessError(process: string, cause: string): string {
  return `${process} failed. because ${cause}`
}

function isSuccess(status: number) {
  return status >= 200 && status < 400
}

export function isURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export async function getProfile(token: string): Promise<{ res: ProfileResponse, extractedToken: string }> {
  const extracted = extractToken(token)
  if (!extracted)
    throw new Error(formatProcessError("Get profile", "entered token is invalid"))

  let res: Response
  let json: JSON
  try {
    res = await fetch(PROFILE_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${extracted}`,
      }
    })
    json = await res.json()
    console.log(`${PROFILE_URL}\n${JSON.stringify(json, null, 2)}`)
  } catch {
    throw new Error(formatProcessError("Get profile", "an error occurred. Please check the console"))
  }
  if (!isSuccess(res.status))
    throw new Error(formatProcessError("Get profile", `the server responded with a bad statuscode ${res.status}`))

  const profileRes = ProfileResponse.safeParse(json)
  if (!profileRes.success)
    throw new Error(formatProcessError("Get profile", profileRes.error.message))

  return { res: profileRes.data, extractedToken: extracted }
}

export async function getNameChange(token: string): Promise<NameChangeResponse> {
  const extracted = extractToken(token)
  if (!extracted)
    throw new Error(formatProcessError("Get name change", "entered token is invalid"))

  let res: Response
  let json: JSON
  try {
    res = await fetch(NAME_CHANGE_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${extracted}`,
      }
    })
    json = await res.json()
    console.log(`${NAME_CHANGE_URL}\n${JSON.stringify(json, null, 2)}`)
  } catch {
    throw new Error(formatProcessError("Get name change", "an error occurred. Please check the console"))
  }
  if (!isSuccess(res.status))
    throw new Error(formatProcessError("Get name change", `the server responded with a bad statuscode ${res.status}`))

  const nameChangeRes = NameChangeResponse.safeParse(json)
  if (!nameChangeRes.success)
    throw new Error(formatProcessError("Get name change", nameChangeRes.error.message))

  return nameChangeRes.data
}

export async function resetSkin(token: string): Promise<string> {
  const extracted = extractToken(token)
  if (!extracted)
    throw new Error(formatProcessError("Reset skin", "entered token is invalid"))

  let res: Response
  try {
    res = await fetch(SKINS_ACTIVE_URL, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${extracted}`,
      }
    })
  } catch {
    throw new Error(formatProcessError("Reset skin", "an error occurred. Please check the console"))
  }
  if (!isSuccess(res.status))
    throw new Error(formatProcessError("Reset skin", `the server responded with a bad statuscode ${res.status}`))

  return extracted
}

export async function changeSkinWithURL(url: string, skinVariant: "Classic" | "Slim", token: string): Promise<string> {
  let file: File
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    throw new Error(formatProcessError("Change skin", "an error occurred. Please check the console"))
  }

  const blob = await res.blob()
  if (blob && blob.type === "image/png") {
    file = new File([blob], "skin.png", {type: "image/png"})
  } else {
    throw new Error(formatProcessError("Change skin", "failed to download skin file"))
  }

  return changeSkin(file, skinVariant, token)
}

export async function changeSkin(file: File | null, skinVariant: "Classic" | "Slim", token: string): Promise<string> {
  if (!file)
    throw new Error(formatProcessError("Change skin", "skin file is not selected"))
  const extracted = extractToken(token)
  if (!extracted)
    throw new Error(formatProcessError("Change skin", "entered token is invalid"))

  let res: Response
  try {
    const formData = new FormData();
    formData.append("file", file)
    formData.append("variant", skinVariant.toUpperCase())
    res = await fetch(SKINS_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${extracted}`,
      },
      body: formData
    })
  } catch {
    throw new Error(formatProcessError("Change skin", "an error occurred. Please check the console"))
  }
  if (!isSuccess(res.status))
    throw new Error(formatProcessError("Change skin", `the server responded with a bad statuscode ${res.status}`))

  return extracted
}

export async function changeName(name: string, token: string): Promise<string> {
  if (MC_NAME_REGEX.test(name)) {
    throw new Error(formatProcessError("Change name", "entered name is invalid"))
  }
  const extracted = extractToken(token)
  if (!extracted)
    throw new Error(formatProcessError("Change name", "entered token is invalid"))

  let res: Response
  try {
    res = await fetch(`${NAME_URL}/${name}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${extracted}`,
      }
    })
  } catch {
    throw new Error(formatProcessError("Change name", "an error occurred. Please check the console"))
  }
  if (!isSuccess(res.status))
    throw new Error(formatProcessError("Change name", `the server responded with a bad statuscode ${res.status}`))

  return extracted
}

export async function changeCape(id: string, token: string): Promise<string> {
  const extracted = extractToken(token)
  if (!extracted)
    throw new Error(formatProcessError("Change cape", "entered token is invalid"))

  let res: Response
  try {
    res = await fetch(CAPES_ACTIVE_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${extracted}`,
      },
      body: JSON.stringify({capeId: id})
    })
  } catch {
    throw new Error(formatProcessError("Change cape", "an error occurred. Please check the console"))
  }
  if (!isSuccess(res.status))
    throw new Error(formatProcessError("Change cape", `the server responded with a bad statuscode ${res.status}`))

  return extracted
}

export async function resetCape(token: string): Promise<string> {
  const extracted = extractToken(token)
  if (!extracted)
    throw new Error(formatProcessError("Reset cape", "entered token is invalid"))

  let res: Response
  try {
    res = await fetch(CAPES_ACTIVE_URL, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${extracted}`
      }
    })
  } catch {
    throw new Error(formatProcessError("Reset cape", "an error occurred. Please check the console"))
  }
  if (!isSuccess(res.status))
    throw new Error(formatProcessError("Reset cape", `the server responded with a bad statuscode ${res.status}`))

  return extracted
}