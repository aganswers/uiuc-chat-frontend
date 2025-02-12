import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import { convertChatToDBMessage } from '@/pages/api/conversation'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, conversationId, user_email, course_name } = req.body
    
    // First check if the message exists
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('*')
      .eq('id', message.id)
      .single();

    const dbMessage = convertChatToDBMessage(message, conversationId);

    // If message exists, update it. If not, insert it.
    const { data, error } = await supabase
      .from('messages')
      .upsert([dbMessage], {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error in message upsert:', error);
      return res.status(500).json({ error: error.message });
    }

    // If this was an edit of an existing message, we need to handle following messages
    if (existingMessage) {
      const { data: followingMessages, error: followingError } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .gt('created_at', existingMessage.created_at)
        .order('created_at', { ascending: true });

      if (followingError) {
        console.error('Error fetching following messages:', followingError);
      } else if (followingMessages?.length > 0) {
        // First mark messages as superseded
        const { error: updateError } = await supabase
          .from('messages')
          .update({ superseded_by: message.id })
          .in('id', followingMessages.map(m => m.id));

        if (updateError) {
          console.error('Error updating superseded messages:', updateError);
        }

        // Then delete the following messages
        const { error: deleteError } = await supabase
          .from('messages')
          .delete()
          .in('id', followingMessages.map(m => m.id));

        if (deleteError) {
          console.error('Error deleting superseded messages:', deleteError);
          return res.status(500).json({ error: deleteError.message });
        }
      }
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in upsert handler:', error);
    return res.status(500).json({ error: error.message });
  }
} 