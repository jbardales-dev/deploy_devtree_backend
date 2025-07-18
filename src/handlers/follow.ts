import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import User from '../models/User'

// Tipo auxiliar solo para esta lógica si deseas evitar conflictos con Express.User
interface AuthUser {
  _id: ObjectId
  following: ObjectId[]
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

    const isFollowing = user.following.some(id => (id as ObjectId).equals(target._id))

if (isFollowing) {
    user.following = user.following.filter(id => !(id as ObjectId).equals(target._id))
    target.followers = target.followers.filter(id => !(id as ObjectId).equals(user._id))
} else {
    user.following.push(target._id)
    target.followers.push(user._id)
}

    // Actualizamos ambos usuarios
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
