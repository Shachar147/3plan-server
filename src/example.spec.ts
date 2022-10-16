class FriendsList {
  friends = [];

  addFriend(name) {
    this.friends.push(name);
  }
}

//tests
describe('FriendsList', () => {
  it('initializes friends list', () => {
    const friendsList = new FriendsList();
    expect(friendsList.friends.length).toEqual(0);
  });

  it('add a friend to the list', () => {
    const friendsList = new FriendsList();
    friendsList.addFriend('moshe');
    expect(friendsList.friends.length).toEqual(1);
  });
});
