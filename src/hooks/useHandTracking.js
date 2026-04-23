import { useEffect, useRef } from 'react'

const THUMB_TIP  = 4
const INDEX_TIP  = 8
const MIDDLE_TIP = 12
const RING_TIP   = 16
const PINKY_TIP  = 20
const INDEX_MCP  = 5
const MIDDLE_MCP = 9
const RING_MCP   = 13
const PINKY_MCP  = 17
const WRIST      = 0

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

// wrist.x < 0.5 in MediaPipe's unmirrored coords = user's RIGHT hand
function getSide(lm) {
  return lm[WRIST].x < 0.5 ? 'Right' : 'Left'
}

function isPinching(lm) {
  return dist(lm[THUMB_TIP], lm[INDEX_TIP]) < 0.09
}

function isIndexThumbOpen(lm) {
  const spread = dist(lm[THUMB_TIP], lm[INDEX_TIP])
  const mid  = dist(lm[MIDDLE_TIP], lm[MIDDLE_MCP])
  const ring = dist(lm[RING_TIP],   lm[RING_MCP])
  const pink = dist(lm[PINKY_TIP],  lm[PINKY_MCP])
  return spread > 0.12 && mid < 0.13 && ring < 0.13 && pink < 0.13
}

function isAllOpen(lm) {
  return [
    [INDEX_TIP, INDEX_MCP],
    [MIDDLE_TIP, MIDDLE_MCP],
    [RING_TIP, RING_MCP],
    [PINKY_TIP, PINKY_MCP],
  ].every(([tip, mcp]) => lm[tip].y < lm[mcp].y - 0.04)
}

export function useHandTracking(videoRef, canvasRef, onGesture) {
  const onGestureRef = useRef(onGesture)
  onGestureRef.current = onGesture

  useEffect(() => {
    let active = true
    let camera = null
    let hands = null

    function waitForMediaPipe(cb) {
      if (window.Hands && window.Camera) { cb(); return }
      setTimeout(() => waitForMediaPipe(cb), 100)
    }

    waitForMediaPipe(() => {
      if (!active || !videoRef.current) return

      hands = new window.Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      })

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      })

      hands.onResults((results) => {
        if (!active) return
        drawSkeleton(results)
        detectGesture(results)
      })

      camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (hands && videoRef.current) await hands.send({ image: videoRef.current })
        },
        width: 320,
        height: 240,
      })
      camera.start()
    })

    function drawSkeleton(results) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (!results.multiHandLandmarks) return

      const CONNECTIONS = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [5,9],[9,10],[10,11],[11,12],
        [9,13],[13,14],[14,15],[15,16],
        [13,17],[17,18],[18,19],[19,20],[0,17],
      ]
      const TIPS = new Set([4, 8, 12, 16, 20])

      results.multiHandLandmarks.forEach((lm) => {
        // Use wrist position to determine side — more reliable than MediaPipe's classifier
        const side  = getSide(lm)
        const color = side === 'Left' ? '#ffffff' : '#7dff9a'

        ctx.strokeStyle = color + 'cc'
        ctx.lineWidth = 2.5
        CONNECTIONS.forEach(([a, b]) => {
          ctx.beginPath()
          ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height)
          ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height)
          ctx.stroke()
        })
        lm.forEach((pt, idx) => {
          ctx.beginPath()
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, TIPS.has(idx) ? 5 : 3, 0, Math.PI * 2)
          ctx.fillStyle = TIPS.has(idx) ? color : color + 'cc'
          ctx.fill()
        })


      })
    }

    function detectGesture(results) {
      const lms = results.multiHandLandmarks
      if (!lms?.length) { onGestureRef.current({ type: 'none' }); return }

      // Use wrist position to determine side — ignores MediaPipe's handedness classifier
      const handList = lms.map((lm) => ({ lm, side: getSide(lm) }))
      const L = handList.find(h => h.side === 'Left')
      const R = handList.find(h => h.side === 'Right')

      // Both hands open → grid
      if (L && R && isAllOpen(L.lm) && isAllOpen(R.lm)) {
        onGestureRef.current({ type: 'grid' }); return
      }
      // Both hands pinching → zoom into front painting
      if (L && R && isPinching(L.lm) && isPinching(R.lm)) {
        onGestureRef.current({ type: 'zoom' }); return
      }
      // Both index+thumb open → expand
      if (L && R && isIndexThumbOpen(L.lm) && isIndexThumbOpen(R.lm)) {
        onGestureRef.current({ type: 'expand' }); return
      }
      // Left pinch → spin
      if (L && isPinching(L.lm)) {
        const tip = L.lm[INDEX_TIP]
        onGestureRef.current({ type: 'spin', x: tip.x, y: tip.y }); return
      }
      // Right pinch → add/remove
      if (R && isPinching(R.lm)) {
        onGestureRef.current({ type: 'addRemove' }); return
      }

      onGestureRef.current({ type: 'idle' })
    }

    return () => {
      active = false
      camera?.stop()
      hands?.close()
    }
  }, [])
}
