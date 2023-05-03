import { config as dotenv } from 'dotenv'
import axios from 'axios'
import * as fs from 'fs'
import FormData from 'form-data'

dotenv()

const COMPLETIONS_API = `https://api.openai.com/v1/chat/completions`
const TRANSCRIPTION_API = `https://api.openai.com/v1/audio/transcriptions`
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const transcribe = async (path: string): Promise<string> => {
    const formData = new FormData()
    formData.append('model', 'whisper-1')
    formData.append('file', fs.createReadStream(path))
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
                    role: 'user',
                    content: `Summarize the following conversation transcript as bullet points sorted by descending importance: "${input}"`,
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
    return response.data.choices
}

const main = async () => {
    try {
        const transcription = await transcribe('mc31.mp3')
        const summary = await summarize(transcription)
        console.log(summary)
    } catch (error) {
        console.error('Error in API request:', error.response.data)
    }
    // writeFile('models.json', JSON.stringify(response.data), (err) => {
    //     if (err) {
    //         console.log(err)
    //     }
    // })
}

main()
