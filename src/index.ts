import { config as dotenv } from 'dotenv'
import axios from 'axios'
import { createReadStream, writeFile } from 'fs'
import FormData from 'form-data'

dotenv()

const COMPLETIONS_API = `https://api.openai.com/v1/chat/completions`
const TRANSCRIPTION_API = `https://api.openai.com/v1/audio/transcriptions`
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const transcribe = async (path: string): Promise<string> => {
    const formData = new FormData()
    formData.append('model', 'whisper-1')
    formData.append('file', createReadStream(path))
    // formData.append('response_format', 'verbose_json')

    const response = await axios.post(TRANSCRIPTION_API, formData, {
        headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
    })

    return response.data.text
}

const summarize = async (input: string): Promise<any> => {
    const response = await axios.post(
        COMPLETIONS_API,
        {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `Here is a meeting transcript: "${input}"`,
                },
                {
                    role: 'user',
                    content:
                        'Summarize the meeting transcript as bullet points sorted by descending importance.',
                },
            ],
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
        },
    )
    return response.data.choices[0].message.content
}

const actionItems = async (input: string): Promise<any> => {
    const response = await axios.post(
        COMPLETIONS_API,
        {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `Here is a meeting transcript: "${input}"`,
                },
                {
                    role: 'user',
                    content: `Please list any action items, loose ends, or tasks discussed in the transcript that need to be completed by the participants or their coworkers.`,
                },
            ],
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
        },
    )
    return response.data.choices[0].message.content
}

const main = async () => {
    try {
        const transcription = await transcribe('expert.mp3')
        writeFile('out/transcription.txt', transcription, (err) => {
            if (err) {
                console.log(err)
            }
        })
        const summary = await summarize(transcription)
        writeFile('out/summary.txt', summary, (err) => {
            if (err) {
                console.log(err)
            }
        })
        const items = await actionItems(transcription)
        writeFile('out/items.txt', items, (err) => {
            if (err) {
                console.log(err)
            }
        })
    } catch (error) {
        console.error('Error in API request:', error.response.data)
    }
}

main()
