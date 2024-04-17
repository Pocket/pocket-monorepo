export class ListenModel {
  // Estimated words per minute when listening (pulled from Web)
  private static wordsPerMinute = 155;
  /**
   * Compute estimated listen time (in seconds) for an article.
   * @param words number of words in article body
   * @returns estimated seconds of listening time, or null if
   * invalid input (negative number, nullish)
   */
  public static estimateDuration(words: number | null): number | null {
    if (words == null || words < 0) return null;
    return Math.round((words / ListenModel.wordsPerMinute) * 60);
  }
}
