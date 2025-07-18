import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import User from '../models/User'

// Tipo para el usuario autenticado
interface AuthUser {
    _id: ObjectId
    following: ObjectId[]
    // Puedes agregar más campos si los necesitas
}

export const followUser = async (req: Request, res: Response) => {
    const user = req.user as AuthUser
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
            // Unfollow
            user.following = user.following.filter(id => !id.equals(target._id))
            target.followers = target.followers.filter(id => !id.equals(user._id))
            await User.findByIdAndUpdate(user._id, { following: user.following })
            await User.findByIdAndUpdate(target._id, { followers: target.followers })
            return res.json({ message: 'Usuario dejado de seguir.', isFollowing: false })
        } else {
            // Follow
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

export const getFollowing = async (req: Request, res: Response) => {
    const userId = req.params.id as string
    const user = await User.findById(userId).populate('following', 'name handle')
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json(user.following)
}

export const getFollowers = async (req: Request, res: Response) => {
    const userId = req.params.id as string
    const user = await User.findById(userId).populate('followers', 'name handle')
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json(user.followers)
}

export const isFollowing = async (req: Request, res: Response) => {
    const currentUserId = req.params.currentUserId as string
    const handle = req.params.handle

    try {
        const user = await User.findById(currentUserId)
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" })

        const targetUser = await User.findOne({ handle })
        if (!targetUser) return res.status(404).json({ message: "Usuario objetivo no encontrado" })

        const isFollowing = user.following.some(followingId =>
            followingId.equals(targetUser._id)
        )

        res.json({ isFollowing })
    } catch (error) {
        console.error("Error en isFollowing:", error)
        res.status(500).json({ message: "Error del servidor" })
    }
}

export const checkFollowStatus = async (req: Request, res: Response) => {
    try {
        const followerId = req.query.followerId as string
        const handle = req.query.handle as string
        const user = req.user as AuthUser

        if (!user) {
            return res.status(401).json({ message: "No autorizado" })
        }

        if (!followerId || !handle) {
            return res.status(400).json({ message: "Se requieren followerId y handle" })
        }

        if (followerId !== user._id.toString()) {
            return res.status(403).json({ message: "No tienes permiso para esta acción" })
        }

        const targetUser = await User.findOne({ handle })
        if (!targetUser) {
            return res.status(404).json({ message: "Usuario objetivo no encontrado" })
        }

        const isFollowing = user.following.some(id =>
            id.equals(targetUser._id)
        )

        res.json({ isFollowing })
    } catch (error) {
        console.error("Error en checkFollowStatus:", error)
        res.status(500).json({ message: "Error del servidor" })
    }
}
