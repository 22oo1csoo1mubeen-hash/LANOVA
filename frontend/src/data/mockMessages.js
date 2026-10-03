// LANOVA — Mock conversation data per user
// Replace with real WebSocket messages during backend integration.

export const mockConversations = {
  '1': [
    { id: 'm1', sender: 'me',    text: 'Hey Ahmed!',                             time: '10:24 AM', read: true  },
    { id: 'm2', sender: 'me',    text: 'Are you free for the CN project discussion?', time: '10:25 AM', read: true  },
    { id: 'm3', sender: 'other', text: 'Hey!',                                   time: '10:25 AM', read: true  },
    { id: 'm4', sender: 'other', text: "Yeah, I'm free now.",                    time: '10:26 AM', read: true  },
    { id: 'm5', sender: 'other', text: "Let's discuss it.",                       time: '10:26 AM', read: true  },
    { id: 'm6', sender: 'me',    text: 'Great!',                                  time: '10:27 AM', read: true  },
    { id: 'm7', sender: 'me',    text: "I'll share the files in a few minutes.",  time: '10:27 AM', read: true  },
    { id: 'm8', sender: 'other', text: 'Okay 👍',                                time: '10:27 AM', read: true  },
  ],
  '2': [
    { id: 'm1', sender: 'other', text: 'Hey, how is the project going?',          time: '09:10 AM', read: true  },
    { id: 'm2', sender: 'me',    text: 'Almost done with the frontend!',          time: '09:12 AM', read: true  },
    { id: 'm3', sender: 'other', text: 'Nice! Let me know when to test.',         time: '09:13 AM', read: true  },
  ],
  '3': [
    { id: 'm1', sender: 'me',    text: 'Arman, did you submit the CN assignment?', time: 'Yesterday', read: true },
    { id: 'm2', sender: 'other', text: 'Yes, submitted last night.',              time: 'Yesterday', read: true  },
  ],
  '4': [
    { id: 'm1', sender: 'other', text: 'Zaid here. See you in class.',            time: 'Yesterday', read: true  },
  ],
  '5': [
    { id: 'm1', sender: 'me',    text: 'Project update sent.',                   time: '09:15 AM', read: true  },
    { id: 'm2', sender: 'other', text: 'Got it, thanks!',                        time: '09:18 AM', read: true  },
  ],
  '6': [
    { id: 'm1', sender: 'other', text: 'Hassan offline for now.',                time: 'Mon',      read: true  },
  ],
  '7': [
    { id: 'm1', sender: 'other', text: 'Bilal: See you tomorrow.',               time: 'Sun',      read: true  },
  ],
  '8': [
    { id: 'm1', sender: 'other', text: 'Rehan: heading out.',                   time: 'Sat',      read: true  },
  ],
};
