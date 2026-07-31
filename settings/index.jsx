function mySettings(props) {
  return (
    <Page>
      <Section title="AI Assistant">
        <TextInput
          title="Type your prompt here"
          label="Custom Prompt"
          settingsKey="customPrompt"
          placeholder="Ask me anything..."
        />
      </Section>
      
      <Section title={<Text bold align="center">Watch Notes</Text>}>
        <TextInput
          title="Secret Notes"
          settingsKey="stored_notes"
          label="Type or paste text here"
          placeholder="Max 2,048 characters..."
          action="Send to Watch"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);