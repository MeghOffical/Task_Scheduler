"use client"

import React from "react"
import ReactMarkdown from "react-markdown"

type Props = { content: string }

export default function MarkdownRenderer({ content }: Props) {
  return <ReactMarkdown>{content}</ReactMarkdown>
}
