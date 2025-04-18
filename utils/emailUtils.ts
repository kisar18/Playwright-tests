import axios from "axios"

const MAIL_TM_BASE = "https://api.mail.tm"

interface Email {
  id: string;
}

export async function createTempEmail() {
  const domainRes = await axios.get(`${MAIL_TM_BASE}/domains`)
  const domain = domainRes.data["hydra:member"][0].domain

  const random = Math.random().toString(36).substring(2, 10)
  const address = `${random}@${domain}`
  const password = "Test1234!"

  await axios.post(`${MAIL_TM_BASE}/accounts`, {
    address,
    password,
  })

  const tokenRes = await axios.post(`${MAIL_TM_BASE}/token`, {
    address,
    password,
  })

  const token = tokenRes.data.token

  return { address, token }
}

export async function waitForEmail(token: string, retries: number = 10): Promise<any> {
  if (retries === 0) {
    throw new Error('E-mail nedorazil ani po několika pokusech')
  }

  const response = await fetch('https://api.mail.tm/messages', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const res = await response.json()
  const messages: Email[] = res['hydra:member']

  if (messages.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return waitForEmail(token, retries - 1)
  }

  const emailId = messages[0].id

  const emailResponse = await fetch(`https://api.mail.tm/messages/${emailId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const emailRes = await emailResponse.json()
  return emailRes
}