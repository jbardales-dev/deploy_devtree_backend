import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import User from '../models/User'

interface AuthUser {
  _id: ObjectId
  following: unknown[] // TypeScript lo ve así
}

export const followUser = async (req: Request, res: Response) => {
  const user = req.user as AuthUser
  const handle = req.params.handle

  try {
    const target = await User.findOne({ handle })
    if (!target) return res.status(404).json({ error: 'Usuario objetivo no encontrado.' })

    if (user._id.equals(target._id)) {
      return res.status(400).json({ error: 'No puedes seguirte a ti mismo.' })
    }

    const followingIds = user.following as ObjectId[]
    const followerIds = target.followers as ObjectId[]

    const isFollowing = followingIds.some(id => id.equals(target._id))

    if (isFollowing) {
      user.following = followingIds.filter(id => !id.equals(target._id))
      target.followers = followerIds.filter(id => !id.equals(user._id))
    } else {
      user.following.push(target._id)
      target.followers.push(user._id)
    }

    await User.findByIdAndUpdate(user._id, { following: user.following })
    await User.findByIdAndUpdate(target._id, { followers: target.followers })

    res.json({
      message: isFollowing ? 'Usuario dejado de seguir.' : 'Usuario seguido con éxito.',
      isFollowing: !isFollowing
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al seguir o dejar de seguir al usuario.' })
  }
}
