const Message = ({ message }) => {
  const formatContent = (content) => {
    return content
      .replace(/\n/g, "<br>")
      .replace(
        /```(\w+)?\n([\s\S]*?)\n```/g,
        (match, language, code) =>
          `<pre><code class="language-${
            language || ""
          }">${code.trim()}</code></pre>`
      )
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/(\w+)\^(\d+|[a-z])/g, "$1<sup>$2</sup>");
  };

  return (
    <div className={`message ${message.sender}`}>
      <div
        className="content"
        dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
      />
      <div className="timestamp">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default Message;
