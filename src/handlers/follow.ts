import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import User from '../models/User'
import mongoose from 'mongoose'

interface AuthUser {
  _id: ObjectId
  following: ObjectId[]
}

export const followUser = async (req: Request, res: Response) => {
  const user = req.user as AuthUser | undefined
  const handle = req.params.handle

  if (!user || !user._id || !user.following) {
    return res.status(401).json({ error: 'Usuario no autenticado o datos incompletos.' })
  }

  if (!handle) {
    return res.status(400).json({ error: 'El handle es requerido.' })
  }

  try {
    const target = await User.findOne({ handle })
    if (!target) return res.status(404).json({ error: 'Usuario objetivo no encontrado.' })

    const userId = user._id as ObjectId
    const targetId = target._id as ObjectId

    if (userId.equals(targetId)) {
      return res.status(400).json({ error: 'No puedes seguirte a ti mismo.' })
    }

    const followingIds = user.following as ObjectId[]
    const followerIds = target.followers as ObjectId[]

    const isFollowing = followingIds.some(id => id.equals(targetId))

    if (isFollowing) {
      user.following = followingIds.filter(id => !id.equals(targetId))
      target.followers = followerIds.filter(id => !id.equals(userId))
    } else {
      user.following.push(targetId)
      target.followers.push(userId)
    }

    await User.findByIdAndUpdate(userId, { following: user.following })
    await User.findByIdAndUpdate(targetId, { followers: target.followers })

    res.json({
      message: isFollowing ? 'Usuario dejado de seguir.' : 'Usuario seguido con éxito.',
      isFollowing: !isFollowing
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al seguir o dejar de seguir al usuario.' })
  }
}

export const unfollowUser = async (req: Request, res: Response) => {
  const user = req.user as AuthUser | undefined
  const handle = req.params.handle

  if (!user || !user._id || !user.following) {
    return res.status(401).json({ error: 'Usuario no autenticado o datos incompletos.' })
  }

  if (!handle) {
    return res.status(400).json({ error: 'El handle es requerido.' })
  }

  try {
    const target = await User.findOne({ handle })
    if (!target) return res.status(404).json({ error: 'Usuario objetivo no encontrado.' })

    const userId = user._id as ObjectId
    const targetId = target._id as ObjectId

    if (userId.equals(targetId)) {
      return res.status(400).json({ error: 'No puedes dejar de seguirte a ti mismo.' })
    }

    user.following = user.following.filter(id => !id.equals(targetId))
    target.followers = target.followers.filter(id => !id.equals(userId))

    await User.findByIdAndUpdate(userId, { following: user.following })
    await User.findByIdAndUpdate(targetId, { followers: target.followers })

    res.json({ message: 'Has dejado de seguir al usuario.', isFollowing: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al dejar de seguir al usuario.' })
  }
}

export const checkFollowStatus = async (req: Request, res: Response) => {
  const { currentUserId, handle } = req.params

  if (!currentUserId || !handle) {
    return res.status(400).json({ error: 'Faltan parámetros: currentUserId o handle.' })
  }

  try {
    const userToCheck = await User.findOne({ handle })

    if (!userToCheck) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const isFollowing = userToCheck.followers.some(followerId =>
      followerId.equals(new mongoose.Types.ObjectId(currentUserId))
    )

    res.json({ isFollowing })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error en el servidor al verificar el estado de seguimiento.' })
  }
}
