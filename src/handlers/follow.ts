import { Request, Response } from 'express'
import { IUser } from '../models/User'
import User from '../models/User'

export const followUser = async (req: Request, res: Response) => {
    const user = req.user as IUser
    const handle = req.params.handle

    try {
        const target = await User.findOne({ handle })

        if (!target) {
            return res.status(404).json({ error: 'Usuario objetivo no encontrado.' })
        }

        if (user._id.equals(target._id)) {
            return res.status(400).json({ error: 'No puedes seguirte a ti mismo.' })
        }

        const isFollowing = user.following.some(id => id.equals(target._id))

        if (isFollowing) {
            user.following = user.following.filter(id => !id.equals(target._id))
            target.followers = target.followers.filter(id => !id.equals(user._id))
            await User.findByIdAndUpdate(user._id, { following: user.following })
            await User.findByIdAndUpdate(target._id, { followers: target.followers })
            return res.json({ message: 'Usuario dejado de seguir.', isFollowing: false })
        } else {
            user.following.push(target._id)
            target.followers.push(user._id)
            await User.findByIdAndUpdate(user._id, { following: user.following })
            await User.findByIdAndUpdate(target._id, { followers: target.followers })
            return res.json({ message: 'Usuario seguido con éxito.', isFollowing: true })
        }

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Error al seguir o dejar de seguir al usuario.' })
    }
}
