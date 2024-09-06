/* eslint-disable @next/next/no-img-element */
'use client'

import { LiveImageShape, LiveImageShapeUtil } from '@/components/LiveImageShapeUtil'
import { LiveImageTool, MakeLiveButton } from '@/components/LiveImageTool'
import { LockupLink } from '@/components/LockupLink'
import { LiveImageProvider } from '@/hooks/useLiveImage'
import * as fal from '@fal-ai/serverless-client'
import {
	AssetRecordType,
	DefaultSizeStyle,
	Editor,
	TLUiOverrides,
	Tldraw,
	toolbarItem,
	track,
	useEditor,
} from '@tldraw/tldraw'
import { useEffect, useState, useMemo } from 'react'
import { MultimodalChatPanel } from '@/components/MultimodalChatPanel';

// ... (keep your existing configurations)

export default function Home() {
	return (
		<main className="flex h-screen">
			<MultimodalChatPanel />
			<div className="flex-grow">
				<LiveImageProvider appId="tldraw-draw-fast">
					<Tldraw
						overrides={overrides}
						shapeUtils={[LiveImageShapeUtil]}
						shareZone={<MakeLiveButton />}
						persistenceKey="tldraw-draw-fast"
					>
						<LiveImageTool />
					</Tldraw>
				</LiveImageProvider>
			</div>
		</main>
	)
}
