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
                    content: `You are a helpful assistant for a company.`,
                },
                {
                    role: 'system',
                    content: `User messages will be the transcript of a meeting.`,
                },
                {
                    role: 'system',
                    content: `Please respond to user messages with a brief summary of the meeting transcript.`,
                },
                {
                    role: 'user',
                    content: input,
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
                    content: `You are a helpful assistant for a company.`,
                },
                {
                    role: 'system',
                    content: `User messages will be the transcript of a meeting.`,
                },
                {
                    role: 'system',
                    content: `Please respond to meeting transcripts with a bulleted list of suggested tasks or action items that may need to be created as a result of the meeting.`,
                },
                {
                    role: 'system',
                    content: `Do not include a header.`,
                },
                {
                    role: 'system',
                    content: `Subtasks should be nested under tasks.`,
                },
                {
                    role: 'system',
                    content: `Tasks should include any details discussed that are important to the task.`,
                },
                {
                    role: 'user',
                    content: input,
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
